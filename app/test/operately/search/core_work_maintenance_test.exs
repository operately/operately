defmodule Operately.Search.CoreWorkMaintenanceTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Ecto.Query

  alias Operately.Access
  alias Operately.Messages.Message
  alias Operately.Projects.Project
  alias Operately.Search
  alias Operately.Search.{Entry, IndexRun, Indexer}
  alias Operately.Support.Factory

  @source_types ["project", "goal", "milestone", "task", "person", "discussion", "project_check_in", "goal_check_in", "project_retrospective"]

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
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.add_company_member(:teammate, name: "Taylor Reed", title: "Product lead")
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)
      |> Factory.add_project_check_in(:project_check_in, :project, :creator)
      |> Factory.add_goal_update(:goal_check_in, :goal, :creator)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)

    Repo.delete_all(Oban.Job)
    ctx
  end

  test "core sources backfill in resumable batches and rerun idempotently", ctx do
    first_runs = start_and_drain_all(:backfill)

    assert Enum.all?(first_runs, &(&1.status == :completed))
    assert Enum.all?(first_runs, &(&1.processed_count > 0))
    assert_entry(:project, ctx.project.id)
    assert_entry(:goal, ctx.goal.id)
    assert_entry(:milestone, ctx.milestone.id)
    assert_entry(:task, ctx.task.id)
    assert_entry(:person, ctx.teammate.id)
    assert_entry(:discussion, ctx.discussion.id)
    assert_entry(:project_check_in, ctx.project_check_in.id)
    assert_entry(:goal_check_in, ctx.goal_check_in.id)
    assert_entry(:project_retrospective, ctx.retrospective.id)

    second_runs = start_and_drain_all(:backfill)

    indexed_count = indexed_core_entry_count()
    assert Enum.sum(Enum.map(second_runs, & &1.unchanged_count)) == indexed_count

    assert Repo.aggregate(
             from(entry in Entry, where: entry.source_type in ^Enum.map(@source_types, &String.to_existing_atom/1)),
             :count
           ) == indexed_count
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

  test "reconciliation repairs and restores check-in and retrospective entries", ctx do
    start_and_drain_all(:backfill)

    assert_entry(:project_check_in, ctx.project_check_in.id)
    |> Ecto.Changeset.change(title: "Stale title")
    |> Repo.update!()

    ctx.project
    |> Ecto.Changeset.change(group_id: ctx.other_space.id)
    |> Repo.update!()

    ctx.goal_check_in
    |> Ecto.Changeset.change(state: :draft)
    |> Repo.update!()

    context = Access.get_context!(project_id: ctx.project.id)
    orphan_id = Ecto.UUID.generate()

    assert {:ok, _summary} =
             Indexer.upsert(%{
               source_type: "project_retrospective",
               source_id: orphan_id,
               company_id: ctx.company.id,
               access_context_id: context.id,
               space_id: ctx.space.id,
               project_id: ctx.project.id,
               title: "Project retrospective",
               body: "Missing canonical source",
               body_kind: "content",
               source_updated_at: ctx.retrospective.updated_at
             })

    reconciliation_runs = start_and_drain_all(:reconciliation)

    assert Enum.all?(reconciliation_runs, &(&1.status == :completed))
    repaired_project_check_in = assert_entry(:project_check_in, ctx.project_check_in.id)
    assert repaired_project_check_in.title != "Stale title"
    assert repaired_project_check_in.space_id == ctx.other_space.id
    refute_entry(:goal_check_in, ctx.goal_check_in.id)
    refute_entry(:project_retrospective, orphan_id)

    restored_check_in =
      ctx.goal_check_in
      |> Repo.reload!()
      |> Ecto.Changeset.change(state: :published)
      |> Repo.update!()

    assert restored_check_in.state == :published

    restored_run = start_and_drain(:backfill, "goal_check_in")
    assert restored_run.status == :completed
    assert restored_run.processed_count == 1
    assert restored_run.skipped_count == 0
    assert restored_run.inserted_count == 1
    assert_entry(:goal_check_in, ctx.goal_check_in.id)
  end

  test "reconciliation repairs work items and removes suspended people and orphans", ctx do
    start_and_drain_all(:backfill)

    assert_entry(:milestone, ctx.milestone.id)
    |> Ecto.Changeset.change(title: "Stale milestone")
    |> Repo.update!()

    completed_status = %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
    ctx.task |> Operately.Tasks.Task.changeset(%{task_status: completed_status}) |> Repo.update!()
    ctx.teammate |> Ecto.Changeset.change(suspended: true, suspended_at: DateTime.utc_now(:second)) |> Repo.update!()

    context = Access.get_context!(project_id: ctx.project.id)
    orphan_id = Ecto.UUID.generate()

    assert {:ok, _summary} =
             Indexer.upsert(%{
               source_type: "task",
               source_id: orphan_id,
               company_id: ctx.company.id,
               access_context_id: context.id,
               space_id: ctx.space.id,
               project_id: ctx.project.id,
               title: "Orphan task",
               body: "Missing canonical source",
               body_kind: "description",
               source_updated_at: ctx.task.updated_at
             })

    reconciliation_runs = start_and_drain_all(:reconciliation)
    assert Enum.all?(reconciliation_runs, &(&1.status == :completed))
    assert assert_entry(:milestone, ctx.milestone.id).title == ctx.milestone.title
    assert assert_entry(:task, ctx.task.id).state == :completed
    refute_entry(:person, ctx.teammate.id)
    refute_entry(:task, orphan_id)

    ctx.teammate
    |> Repo.reload!()
    |> Ecto.Changeset.change(suspended: false, suspended_at: nil)
    |> Repo.update!()

    assert start_and_drain(:backfill, "person").status == :completed
    assert_entry(:person, ctx.teammate.id)
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

  defp indexed_core_entry_count do
    Repo.aggregate(
      from(entry in Entry, where: entry.source_type in ^Enum.map(@source_types, &String.to_existing_atom/1)),
      :count
    )
  end
end
