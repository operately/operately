defmodule Operately.Search.CoreWorkMaintenanceTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Access
  alias Operately.Messages.Message
  alias Operately.Projects.Project
  alias Operately.Search
  alias Operately.Search.{Entry, IndexRun, Indexer}
  alias Operately.Support.Factory

  @source_types ["project", "goal", "discussion"]

  setup ctx do
    previous_batch_size = Application.get_env(:operately, :search_index_batch_size, 500)
    Application.put_env(:operately, :search_index_batch_size, 1)
    on_exit(fn -> Application.put_env(:operately, :search_index_batch_size, previous_batch_size) end)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space(:other_space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)

    Repo.delete_all(Oban.Job)
    ctx
  end

  test "core sources backfill in resumable batches and rerun idempotently", ctx do
    first_runs = start_and_drain_all(:backfill)

    assert Enum.all?(first_runs, &(&1.status == :completed))
    assert Enum.all?(first_runs, &(&1.processed_count > 0))
    assert_entry(:project, ctx.project.id)
    assert_entry(:goal, ctx.goal.id)
    assert_entry(:discussion, ctx.discussion.id)

    second_runs = start_and_drain_all(:backfill)

    assert Enum.sum(Enum.map(second_runs, & &1.unchanged_count)) == 3
    assert Repo.aggregate(Entry, :count) == 3
  end

  test "reconciliation repairs stale entries, removes exclusions and orphans, and restores eligibility", ctx do
    start_and_drain_all(:backfill)

    assert_entry(:project, ctx.project.id)
    |> Ecto.Changeset.change(title: "Stale title")
    |> Repo.update!()

    ctx.project
    |> Project.changeset(%{group_id: ctx.other_space.id})
    |> Repo.update!()

    ctx.discussion
    |> Ecto.Changeset.change(state: :draft)
    |> Repo.update!()

    context = Access.get_context!(group_id: ctx.space.id)
    orphan_id = Ecto.UUID.generate()

    assert {:ok, _summary} =
             Indexer.upsert(%{
               source_type: "discussion",
               source_id: orphan_id,
               company_id: ctx.company.id,
               access_context_id: context.id,
               space_id: ctx.space.id,
               title: "Orphan discussion",
               body: "Missing canonical source",
               body_kind: "content",
               source_updated_at: ctx.discussion.updated_at
             })

    reconciliation_runs = start_and_drain_all(:reconciliation)
    assert Enum.all?(reconciliation_runs, &(&1.status == :completed))
    repaired_project = assert_entry(:project, ctx.project.id)
    assert repaired_project.title == ctx.project.name
    assert repaired_project.space_id == ctx.other_space.id
    refute_entry(:discussion, ctx.discussion.id)
    refute_entry(:discussion, orphan_id)

    ctx.discussion
    |> Repo.reload!()
    |> Message.changeset(%{state: :published})
    |> Repo.update!()

    assert start_and_drain(:backfill, "discussion").status == :completed
    assert_entry(:discussion, ctx.discussion.id)
  end

  defp start_and_drain_all(kind) do
    Oban.Testing.with_testing_mode(:manual, fn ->
      runs = Enum.map(@source_types, &start(kind, &1))
      assert %{failure: 0} = Oban.drain_queue(queue: :default, with_recursion: true)
      Enum.map(runs, &Repo.get!(IndexRun, &1.id))
    end)
  end

  defp start_and_drain(kind, source_type) do
    Oban.Testing.with_testing_mode(:manual, fn ->
      run = start(kind, source_type)
      assert %{failure: 0} = Oban.drain_queue(queue: :default, with_recursion: true)
      Repo.get!(IndexRun, run.id)
    end)
  end

  defp start(:backfill, source_type) do
    assert {:ok, run} = Search.start_backfill(source_type)
    run
  end

  defp start(:reconciliation, source_type) do
    assert {:ok, run} = Search.start_reconciliation(source_type)
    run
  end

  defp assert_entry(source_type, source_id) do
    Repo.get_by!(Entry, source_type: source_type, source_id: source_id)
  end

  defp refute_entry(source_type, source_id) do
    refute Repo.get_by(Entry, source_type: source_type, source_id: source_id)
  end
end
