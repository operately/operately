defmodule Operately.Data.Change073PopulateTasksOrderingStateTest do
  use Operately.DataCase

  alias Operately.Projects.Milestone
  alias Operately.Tasks.Task
  alias Operately.Repo
  alias Operately.Data.Change073PopulateTasksOrderingState

  setup ctx do
    ctx
    |> Factory.setup()
  end

  test "populates tasks_ordering_state for milestones with tasks", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    task1 = create_test_task(ctx.creator, ctx.milestone, "First Task")
    :timer.sleep(10) # Ensure different inserted_at times
    task2 = create_test_task(ctx.creator, ctx.milestone, "Second Task")
    :timer.sleep(10)
    task3 = create_test_task(ctx.creator, ctx.milestone, "Third Task")

    reset_milestone_ordering_state(ctx.milestone)

    Change073PopulateTasksOrderingState.run()

    updated_milestone = Repo.get!(Milestone, ctx.milestone.id)
    expected_task_ids = [OperatelyWeb.Paths.task_id(task1), OperatelyWeb.Paths.task_id(task2), OperatelyWeb.Paths.task_id(task3)]
    assert updated_milestone.tasks_ordering_state == expected_task_ids
  end

  test "handles milestones without tasks", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    reset_milestone_ordering_state(ctx.milestone)

    Change073PopulateTasksOrderingState.run()

    updated_milestone = Repo.get!(Milestone, ctx.milestone.id)
    assert updated_milestone.tasks_ordering_state == []
  end

  test "skips milestones that already have tasks_ordering_state populated", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    task = create_test_task(ctx.creator, ctx.milestone, "Test Task")

    # Manually set a different ordering state
    custom_ordering = ["t-1", "t-2", OperatelyWeb.Paths.task_id(task)]
    Repo.update_all(
      from(m in Milestone, where: m.id == ^ctx.milestone.id),
      set: [tasks_ordering_state: custom_ordering]
    )

    Change073PopulateTasksOrderingState.run()

    updated_milestone = Repo.get!(Milestone, ctx.milestone.id)
    assert updated_milestone.tasks_ordering_state == custom_ordering
  end

  test "handles multiple milestones with different task counts", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone1, :project)
    ctx = Factory.add_project_milestone(ctx, :milestone2, :project)
    ctx = Factory.add_project_milestone(ctx, :milestone3, :project)

    task1_1 = create_test_task(ctx.creator, ctx.milestone1, "M1 Task 1")
    :timer.sleep(10)
    task1_2 = create_test_task(ctx.creator, ctx.milestone1, "M1 Task 2")
    :timer.sleep(10)
    task1_3 = create_test_task(ctx.creator, ctx.milestone1, "M1 Task 3")

    :timer.sleep(10)
    task2_1 = create_test_task(ctx.creator, ctx.milestone2, "M2 Task 1")

    # Clear all ordering states
    Repo.update_all(
      from(m in Milestone, where: m.id in [^ctx.milestone1.id, ^ctx.milestone2.id, ^ctx.milestone3.id]),
      set: [tasks_ordering_state: nil]
    )

    Change073PopulateTasksOrderingState.run()

    updated_milestone1 = Repo.get!(Milestone, ctx.milestone1.id)
    updated_milestone2 = Repo.get!(Milestone, ctx.milestone2.id)
    updated_milestone3 = Repo.get!(Milestone, ctx.milestone3.id)

    expected_m1_ids = [OperatelyWeb.Paths.task_id(task1_1), OperatelyWeb.Paths.task_id(task1_2), OperatelyWeb.Paths.task_id(task1_3)]
    expected_m2_ids = [OperatelyWeb.Paths.task_id(task2_1)]

    assert updated_milestone1.tasks_ordering_state == expected_m1_ids
    assert updated_milestone2.tasks_ordering_state == expected_m2_ids
    assert updated_milestone3.tasks_ordering_state == []
  end

  test "processes all milestones in a single transaction", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)

    milestones_and_tasks = Enum.map(1..5, fn i ->
      ctx = Factory.add_project_milestone(ctx, :"milestone#{i}", :project)
      milestone = ctx[:"milestone#{i}"]

      tasks = Enum.map(1..3, fn j ->
        create_test_task(ctx.creator, milestone, "M#{i} Task #{j}")
      end)

      {milestone, tasks}
    end)

    # Clear all ordering states
    milestone_ids = Enum.map(milestones_and_tasks, fn {milestone, _} -> milestone.id end)
    Repo.update_all(
      from(m in Milestone, where: m.id in ^milestone_ids),
      set: [tasks_ordering_state: nil]
    )

    Change073PopulateTasksOrderingState.run()

    Enum.each(milestones_and_tasks, fn {milestone, tasks} ->
      updated_milestone = Repo.get!(Milestone, milestone.id)
      expected_task_ids = Enum.map(tasks, &OperatelyWeb.Paths.task_id/1)
      assert updated_milestone.tasks_ordering_state == expected_task_ids
    end)
  end

  defp create_test_task(creator, milestone, name) do
    {:ok, task} = Repo.insert(%Task{
      name: name,
      description: %{"message" => "Test task description"},
      creator_id: creator.id,
      milestone_id: milestone.id,
      project_id: milestone.project_id,
      status: "todo"
    })

    task
  end

  defp reset_milestone_ordering_state(milestone) do
    Repo.update_all(
      from(m in Milestone, where: m.id == ^milestone.id),
      set: [tasks_ordering_state: nil]
    )
  end
end
