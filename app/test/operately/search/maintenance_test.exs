defmodule Operately.Search.MaintenanceTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.Search
  alias Operately.Search.{Entry, IndexRun, MaintenanceWorker, SourceRegistry}
  alias Operately.Support.Factory

  defmodule ProjectSource do
    @behaviour Operately.Search.Source

    import Ecto.Query

    alias Operately.Access
    alias Operately.Projects.Project
    alias Operately.Repo
    alias Operately.RichContent

    @impl true
    def source_type, do: "project"

    @impl true
    def fetch_batch(cursor, limit) do
      query =
        Project
        |> after_cursor(cursor)
        |> order_by([project], asc: project.id)
        |> limit(^limit)

      {:ok, Repo.all(query, with_deleted: true)}
    end

    @impl true
    def fetch_by_ids(ids) do
      query = from(project in Project, where: project.id in ^ids)
      {:ok, Repo.all(query, with_deleted: true)}
    end

    @impl true
    def to_entry(%Project{name: "skip-project"}), do: :skip
    def to_entry(%Project{name: "adapter-error"}), do: {:error, :deliberate_test_error}
    def to_entry(%Project{deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip

    def to_entry(project) do
      context = Access.get_context!(project_id: project.id)

      {:ok,
       %{
         company_id: project.company_id,
         access_context_id: context.id,
         space_id: project.group_id,
         project_id: project.id,
         title: project.name,
         body: RichContent.to_plain_text(project.description),
         body_kind: "description",
         state: state(project),
         source_inserted_at: project.inserted_at,
         source_updated_at: project.updated_at
       }}
    end

    defp after_cursor(query, nil), do: query
    defp after_cursor(query, cursor), do: where(query, [project], project.id > ^cursor)

    defp state(%{closed_at: closed_at}) when not is_nil(closed_at), do: "closed"
    defp state(%{status: "paused"}), do: "paused"
    defp state(_project), do: nil
  end

  setup do
    previous_sources = Application.get_env(:operately, SourceRegistry, [])
    previous_batch_size = Application.get_env(:operately, :search_index_batch_size, 500)

    Application.put_env(:operately, SourceRegistry, [ProjectSource])
    Application.put_env(:operately, :search_index_batch_size, 1)

    on_exit(fn ->
      Application.put_env(:operately, SourceRegistry, previous_sources)
      Application.put_env(:operately, :search_index_batch_size, previous_batch_size)
    end)

    Factory.setup(%{})
    |> Factory.add_space(:space)
  end

  test "returns a clear error when no sources are registered" do
    Application.put_env(:operately, SourceRegistry, [])
    assert {:error, :no_sources_registered} = Search.start_backfill(:all)
    assert {:error, :unknown_source_type} = Search.start_backfill("missing")
  end

  test "backfills multiple batches and reruns idempotently", ctx do
    ctx =
      ctx
      |> Factory.add_project(:alpha, :space, name: "Alpha project")
      |> Factory.add_project(:beta, :space, name: "Beta project")

    first_run = start_and_drain(:backfill)

    assert first_run.status == :completed
    assert first_run.processed_count == 2
    assert first_run.inserted_count == 2
    assert Repo.aggregate(Entry, :count) == 2

    second_run = start_and_drain(:backfill)

    assert second_run.status == :completed
    assert second_run.unchanged_count == 2
    assert Repo.aggregate(Entry, :count) == 2
    assert Repo.get_by!(Entry, source_id: ctx.alpha.id).title == "Alpha project"
  end

  test "deletes excluded and unsafe entries while reporting failures", ctx do
    ctx
    |> Factory.add_project(:skipped, :space, name: "skip-project")
    |> Factory.add_project(:failed, :space, name: "adapter-error")

    run = start_and_drain(:backfill)

    assert run.status == :completed_with_errors
    assert run.skipped_count == 1
    assert run.failed_count == 1
    assert run.last_error == "deliberate_test_error"
    assert Repo.aggregate(Entry, :count) == 0
  end

  test "reconciliation repairs stale entries and removes orphans", ctx do
    ctx = Factory.add_project(ctx, :project, :space, name: "Original title")
    backfill = start_and_drain(:backfill)
    assert backfill.status == :completed

    entry = Repo.get_by!(Entry, source_id: ctx.project.id)
    entry |> Ecto.Changeset.change(title: "Stale title", space_id: nil) |> Repo.update!()

    context = Access.get_context!(project_id: ctx.project.id)

    {:ok, _} =
      Operately.Search.Indexer.upsert(%{
        source_type: "project",
        source_id: Ecto.UUID.generate(),
        company_id: ctx.company.id,
        access_context_id: context.id,
        title: "Orphan"
      })

    run = start_and_drain(:reconciliation)

    assert run.status == :completed
    assert run.updated_count == 1
    assert run.deleted_orphan_count == 1

    repaired = Repo.get_by!(Entry, source_id: ctx.project.id)
    assert repaired.title == "Original title"
    assert repaired.space_id == ctx.space.id
    assert Repo.aggregate(Entry, :count) == 1
  end

  test "only one active maintenance run is allowed for each source type", ctx do
    Factory.add_project(ctx, :project, :space)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, first_run} = Search.start_backfill("project")
      assert first_run.source_type == :project
      assert first_run.status == :pending

      assert {:error, changeset} = Search.start_reconciliation("project")
      assert %{source_type: ["has already been taken"]} = errors_on(changeset)
    end)
  end

  test "replaying an already committed batch does not double count", ctx do
    Factory.add_project(ctx, :project, :space)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, run} = Search.start_backfill("project")
      [first_job] = all_enqueued(worker: MaintenanceWorker)
      assert first_job.args["run_id"] == run.id
      assert first_job.args["phase"] == "source_scan"

      assert :ok = perform_job(MaintenanceWorker, first_job.args)
      after_first_batch = Search.get_index_run(run.id)

      assert :ok = perform_job(MaintenanceWorker, first_job.args)
      after_replay = Search.get_index_run(run.id)

      assert after_replay.processed_count == after_first_batch.processed_count
      assert after_replay.inserted_count == after_first_batch.inserted_count
    end)
  end

  test "continues jobs queued with the previous source phase name", ctx do
    Factory.add_project(ctx, :project, :space)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, run} = Search.start_backfill("project")
      [job] = all_enqueued(worker: MaintenanceWorker)

      legacy_args = Map.put(job.args, "phase", "sources")
      assert :ok = perform_job(MaintenanceWorker, legacy_args)

      assert Search.get_index_run(run.id).processed_count == 1
    end)
  end

  defp start_and_drain(kind) do
    Oban.Testing.with_testing_mode(:manual, fn ->
      start_result =
        case kind do
          :backfill -> Search.start_backfill("project")
          :reconciliation -> Search.start_reconciliation("project")
        end

      assert {:ok, run} = start_result
      assert %{failure: 0} = Oban.drain_queue(queue: :default, with_recursion: true)
      Repo.get!(IndexRun, run.id)
    end)
  end
end
