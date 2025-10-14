defmodule Operately.Data.Change079UpdateMilestoneTasksOrderingStateTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Projects.Milestone
  alias Operately.Data.Change079UpdateMilestoneTasksOrderingState

  setup ctx do
    ctx
    |> Factory.setup()
  end

  test "updates tasks_ordering_state with only active tasks", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    active_task1 = create_test_task(ctx.creator, ctx.milestone, "Active Task 1", "todo")
    active_task2 = create_test_task(ctx.creator, ctx.milestone, "Active Task 2", "in_progress")
    done_task = create_test_task(ctx.creator, ctx.milestone, "Done Task", "done")
    canceled_task = create_test_task(ctx.creator, ctx.milestone, "Canceled Task", "canceled")

    Change079UpdateMilestoneTasksOrderingState.run()

    updated_milestone = Repo.get!(Milestone, ctx.milestone.id)
    expected_task_ids = [
      OperatelyWeb.Paths.task_id(active_task1),
      OperatelyWeb.Paths.task_id(active_task2)
    ]

    # Sort both lists for consistent comparison
    assert Enum.sort(updated_milestone.tasks_ordering_state) == Enum.sort(expected_task_ids)

    # Verify excluded tasks are not in the ordering state
    refute Enum.member?(updated_milestone.tasks_ordering_state, OperatelyWeb.Paths.task_id(done_task))
    refute Enum.member?(updated_milestone.tasks_ordering_state, OperatelyWeb.Paths.task_id(canceled_task))
  end

  test "handles milestones with no active tasks", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    _done_task = create_test_task(ctx.creator, ctx.milestone, "Done Task", "done")
    _canceled_task = create_test_task(ctx.creator, ctx.milestone, "Canceled Task", "canceled")

    Change079UpdateMilestoneTasksOrderingState.run()

    updated_milestone = Repo.get!(Milestone, ctx.milestone.id)
    assert updated_milestone.tasks_ordering_state == []
  end

  test "handles milestones with mixed tasks", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone1, :project)
    ctx = Factory.add_project_milestone(ctx, :milestone2, :project)

    # Milestone 1 with mixed tasks
    active_task1 = create_test_task(ctx.creator, ctx.milestone1, "Active Task 1", "todo")
    _done_task1 = create_test_task(ctx.creator, ctx.milestone1, "Done Task", "done")
    active_task2 = create_test_task(ctx.creator, ctx.milestone1, "Active Task 2", "in_progress")

    # Milestone 2 with only inactive tasks
    _done_task2 = create_test_task(ctx.creator, ctx.milestone2, "Done Task", "done")
    _canceled_task2 = create_test_task(ctx.creator, ctx.milestone2, "Canceled Task", "canceled")

    Change079UpdateMilestoneTasksOrderingState.run()

    updated_milestone1 = Repo.get!(Milestone, ctx.milestone1.id)
    updated_milestone2 = Repo.get!(Milestone, ctx.milestone2.id)

    expected_milestone1_ids = [
      OperatelyWeb.Paths.task_id(active_task1),
      OperatelyWeb.Paths.task_id(active_task2)
    ]

    # Sort for consistent comparison
    assert Enum.sort(updated_milestone1.tasks_ordering_state) == Enum.sort(expected_milestone1_ids)
    assert updated_milestone2.tasks_ordering_state == []
  end

  test "preserves existing tasks_ordering_state structure", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    active_task1 = create_test_task(ctx.creator, ctx.milestone, "Active Task 1", "todo")
    active_task2 = create_test_task(ctx.creator, ctx.milestone, "Active Task 2", "in_progress")
    done_task = create_test_task(ctx.creator, ctx.milestone, "Done Task", "done")

    # Verify migration works correctly
    Change079UpdateMilestoneTasksOrderingState.run()

    updated_milestone = Repo.get!(Milestone, ctx.milestone.id)
    expected_task_ids = [
      OperatelyWeb.Paths.task_id(active_task1),
      OperatelyWeb.Paths.task_id(active_task2)
    ]

    assert Enum.sort(updated_milestone.tasks_ordering_state) == Enum.sort(expected_task_ids)
    refute Enum.member?(updated_milestone.tasks_ordering_state, OperatelyWeb.Paths.task_id(done_task))
  end

  defp create_test_task(creator, milestone, name, status) do
    attrs = %{
      name: name,
      description: Operately.Support.RichText.rich_text("Test task description"),
      milestone_id: milestone.id,
      status: status,
      creator_id: creator.id,
      assignee_id: creator.id,
      project_id: milestone.project_id
    }

    Operately.TasksFixtures.task_fixture(attrs)
  end
end
