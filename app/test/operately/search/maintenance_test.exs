defmodule Operately.Search.MaintenanceTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.Search
  alias Operately.Search.{Entry, IndexMaintenance, IndexRun, Indexer, MaintenanceWorker, Source, SourceRegistry}
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
        |> Source.lock_for_maintenance()

      {:ok, Repo.all(query, with_deleted: true)}
    end

    @impl true
    def fetch_by_ids(ids) do
      query = Project |> where([project], project.id in ^ids) |> Source.lock_for_maintenance()
      {:ok, Repo.all(query, with_deleted: true)}
    end

    @impl true
    def to_entry(%Project{name: "skip-project"}), do: :skip
    def to_entry(%Project{name: "adapter-error"}), do: {:error, {:invalid, :deliberate_test_error}}
    def to_entry(%Project{name: "retryable-error"}), do: {:error, {:temporary_failure, "private source content"}}
    def to_entry(%Project{name: "raised-error"}), do: raise("private source content")
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

  defmodule FailingProjectSource do
    @behaviour Operately.Search.Source

    @impl true
    def source_type, do: "project"

    @impl true
    def fetch_batch(_cursor, _limit), do: {:error, :deliberate_batch_failure}

    @impl true
    def fetch_by_ids(_ids), do: {:ok, []}

    @impl true
    def to_entry(_source), do: :skip
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

  test "backfill reports a newer indexed entry as superseded", ctx do
    ctx = Factory.add_project(ctx, :project, :space, name: "Canonical source")

    newer_timestamp = NaiveDateTime.add(ctx.project.updated_at, 1, :second)
    assert {:ok, %{inserted: 1}} = index_project(ctx.project, title: "Newer indexed value", source_updated_at: newer_timestamp)

    run = start_and_drain(:backfill)

    assert run.status == :completed
    assert run.superseded_count == 1
    assert Repo.get_by!(Entry, source_id: ctx.project.id).title == "Newer indexed value"
  end

  test "deletes excluded and unsafe entries while reporting failures", ctx do
    ctx = ctx |> Factory.add_project(:skipped, :space) |> Factory.add_project(:failed, :space)
    assert {:ok, _} = index_project(ctx.skipped)
    assert {:ok, _} = index_project(ctx.failed)

    ctx.skipped |> Ecto.Changeset.change(name: "skip-project") |> Repo.update!()
    ctx.failed |> Ecto.Changeset.change(name: "adapter-error") |> Repo.update!()

    run = start_and_drain(:backfill)

    assert run.status == :completed_with_errors
    assert run.skipped_count == 1
    assert run.failed_count == 1
    assert run.last_error == "deliberate_test_error"
    assert Repo.aggregate(Entry, :count) == 0
  end

  test "retryable adapter errors roll back the batch and resume from its checkpoint", ctx do
    ctx = Factory.add_project(ctx, :project, :space, name: "Original title")
    assert {:ok, _} = index_project(ctx.project)
    ctx.project |> Ecto.Changeset.change(name: "retryable-error") |> Repo.update!()

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, run} = Search.start_backfill("project")
      [job] = all_enqueued(worker: MaintenanceWorker)

      log =
        ExUnit.CaptureLog.capture_log(fn ->
          assert {:error, "search index maintenance failed"} = MaintenanceWorker.perform(job)
        end)

      refute log =~ "private source content"

      checkpoint = Search.get_index_run(run.id)
      assert checkpoint.status == :pending
      assert checkpoint.cursor == nil
      assert checkpoint.processed_count == 0
      assert checkpoint.last_error == nil
      assert Repo.get_by!(Entry, source_id: ctx.project.id).title == "Original title"

      recovered_at = NaiveDateTime.add(ctx.project.updated_at, 1, :second)
      ctx.project |> Ecto.Changeset.change(name: "Recovered title", updated_at: recovered_at) |> Repo.update!()
      assert :ok = MaintenanceWorker.perform(job)

      next_job = all_enqueued(worker: MaintenanceWorker) |> Enum.find(& &1.args["cursor"])
      assert :ok = MaintenanceWorker.perform(next_job)

      completed = Search.get_index_run(run.id)
      assert completed.status == :completed
      assert completed.processed_count == 1
      assert Repo.get_by!(Entry, source_id: ctx.project.id).title == "Recovered title"
    end)
  end

  test "adapter exceptions roll back without exposing exception messages", ctx do
    ctx = Factory.add_project(ctx, :project, :space, name: "Original title")
    assert {:ok, _} = index_project(ctx.project)
    ctx.project |> Ecto.Changeset.change(name: "raised-error") |> Repo.update!()

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, run} = Search.start_backfill("project")
      [job] = all_enqueued(worker: MaintenanceWorker)

      log =
        ExUnit.CaptureLog.capture_log(fn ->
          assert {:error, "search index maintenance failed"} = MaintenanceWorker.perform(job)
        end)

      refute log =~ "private source content"
      assert Search.get_index_run(run.id).processed_count == 0
      assert Repo.get_by!(Entry, source_id: ctx.project.id).title == "Original title"
    end)
  end

  test "final adapter exceptions store only their sanitized category", ctx do
    Factory.add_project(ctx, :project, :space, name: "raised-error")

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, run} = Search.start_backfill("project")
      [job] = all_enqueued(worker: MaintenanceWorker)
      final_attempt = %{job | attempt: job.max_attempts}

      log =
        ExUnit.CaptureLog.capture_log(fn ->
          assert {:discard, "search index maintenance failed"} = MaintenanceWorker.perform(final_attempt)
        end)

      failed_run = Search.get_index_run(run.id)
      assert failed_run.status == :failed
      assert failed_run.last_error == "RuntimeError"
      refute failed_run.last_error =~ "private source content"
      refute log =~ "private source content"
    end)
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
        title: "Orphan",
        source_updated_at: ctx.project.updated_at
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

  test "marks a maintenance run as failed after the worker's final attempt" do
    Application.put_env(:operately, SourceRegistry, [FailingProjectSource])

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, run} = Search.start_backfill("project")
      [job] = all_enqueued(worker: MaintenanceWorker)
      final_attempt = %{job | attempt: job.max_attempts}

      assert {:discard, "search index maintenance failed"} = MaintenanceWorker.perform(final_attempt)

      failed_run = Search.get_index_run(run.id)
      assert failed_run.status == :failed
      assert failed_run.last_error == "deliberate_batch_failure"
      assert failed_run.completed_at
    end)
  end

  test "a delayed final failure cannot replace a terminal run", ctx do
    Factory.add_project(ctx, :project, :space)
    run = start_and_drain(:backfill)

    args = %{"run_id" => run.id, "phase" => "source_scan", "cursor" => nil}
    assert :ok = IndexMaintenance.mark_failed(args, :delayed_failure)

    completed_run = Search.get_index_run(run.id)
    assert completed_run.status == :completed
    assert completed_run.last_error == nil
  end

  test "a delayed final failure cannot replace a newer checkpoint", ctx do
    ctx |> Factory.add_project(:alpha, :space) |> Factory.add_project(:beta, :space)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, run} = Search.start_backfill("project")
      [job] = all_enqueued(worker: MaintenanceWorker)
      assert :ok = MaintenanceWorker.perform(job)

      checkpoint = Search.get_index_run(run.id)
      assert checkpoint.status == :running
      assert checkpoint.cursor

      assert :ok = IndexMaintenance.mark_failed(job.args, :delayed_failure)
      assert Search.get_index_run(run.id).status == :running
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

  defp index_project(project, overrides \\ []) do
    {:ok, attrs} = ProjectSource.to_entry(project)

    attrs
    |> Map.merge(Map.new(overrides))
    |> Map.put(:source_type, "project")
    |> Map.put(:source_id, project.id)
    |> Indexer.upsert()
  end
end
