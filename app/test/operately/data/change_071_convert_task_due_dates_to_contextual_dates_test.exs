defmodule Operately.Data.Change071ConvertTaskDueDatesToContextualDatesTest do
  use Operately.DataCase

  alias Operately.Tasks.Task
  alias Operately.Repo
  alias Operately.Data.Change071ConvertTaskDueDatesToContextualDates

  setup ctx do
    ctx
    |> Factory.setup()
  end

  test "converts due_date to contextual_due_date for tasks with due dates", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    # Create tasks with due dates
    task1 = create_test_task_with_due_date(ctx.creator, ctx.milestone, ~N[2025-01-15 10:30:00])
    task2 = create_test_task_with_due_date(ctx.creator, ctx.milestone, ~N[2025-03-22 14:45:00])
    task3 = create_test_task_with_due_date(ctx.creator, ctx.milestone, ~N[2025-12-01 09:00:00])

    Change071ConvertTaskDueDatesToContextualDates.run()

    # Verify the contextual dates were created correctly
    updated_task1 = Repo.get!(Task, task1.id)
    updated_task2 = Repo.get!(Task, task2.id)
    updated_task3 = Repo.get!(Task, task3.id)

    # Task 1: January 15, 2025
    assert updated_task1.due_date.date_type == :day
    assert updated_task1.due_date.date == ~D[2025-01-15]
    assert updated_task1.due_date.value == "Jan 15, 2025"

    # Task 2: March 22, 2025
    assert updated_task2.due_date.date_type == :day
    assert updated_task2.due_date.date == ~D[2025-03-22]
    assert updated_task2.due_date.value == "Mar 22, 2025"

    # Task 3: December 1, 2025
    assert updated_task3.due_date.date_type == :day
    assert updated_task3.due_date.date == ~D[2025-12-01]
    assert updated_task3.due_date.value == "Dec 1, 2025"
  end

  test "skips tasks without due dates", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    # Create a task without a due date
    task_without_due_date = create_test_task_without_due_date(ctx.creator, ctx.milestone)

    # Create a task with a due date for comparison
    task_with_due_date = create_test_task_with_due_date(ctx.creator, ctx.milestone, ~N[2025-06-10 12:00:00])

    Change071ConvertTaskDueDatesToContextualDates.run()

    # Verify the task without due date was not modified
    updated_task_without_due_date = Repo.get!(Task, task_without_due_date.id)
    assert updated_task_without_due_date.due_date == nil

    # Verify the task with due date was processed
    updated_task_with_due_date = Repo.get!(Task, task_with_due_date.id)
    assert updated_task_with_due_date.due_date != nil
    assert updated_task_with_due_date.due_date.value == "Jun 10, 2025"
  end

  test "handles various date formats correctly", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    # Test edge cases for date formatting
    test_cases = [
      {~N[2025-01-01 00:00:00], "Jan 1, 2025"},
      {~N[2025-02-28 23:59:59], "Feb 28, 2025"},
      {~N[2025-04-30 12:30:45], "Apr 30, 2025"},
      {~N[2025-07-04 16:20:10], "Jul 4, 2025"},
      {~N[2025-09-15 08:15:30], "Sep 15, 2025"},
      {~N[2025-11-25 19:45:00], "Nov 25, 2025"}
    ]

    tasks = Enum.map(test_cases, fn {due_date, _expected_value} ->
      create_test_task_with_due_date(ctx.creator, ctx.milestone, due_date)
    end)

    Change071ConvertTaskDueDatesToContextualDates.run()

    # Verify each task was converted correctly
    Enum.zip(tasks, test_cases)
    |> Enum.each(fn {task, {_due_date, expected_value}} ->
      updated_task = Repo.get!(Task, task.id)
      assert updated_task.due_date.date_type == :day
      assert updated_task.due_date.value == expected_value
    end)
  end

  test "handles leap year dates correctly", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    # Test leap year date
    task = create_test_task_with_due_date(ctx.creator, ctx.milestone, ~N[2024-02-29 12:00:00])

    Change071ConvertTaskDueDatesToContextualDates.run()

    updated_task = Repo.get!(Task, task.id)
    assert updated_task.due_date.date_type == :day
    assert updated_task.due_date.date == ~D[2024-02-29]
    assert updated_task.due_date.value == "Feb 29, 2024"
  end

  test "processes multiple tasks in a single transaction", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    # Create multiple tasks
    tasks = Enum.map(1..5, fn i ->
      due_date = NaiveDateTime.add(~N[2025-01-01 12:00:00], i * 24 * 60 * 60, :second)
      create_test_task_with_due_date(ctx.creator, ctx.milestone, due_date)
    end)

    Change071ConvertTaskDueDatesToContextualDates.run()

    # Verify all tasks were processed
    Enum.each(tasks, fn task ->
      updated_task = Repo.get!(Task, task.id)
      assert updated_task.due_date != nil
      assert updated_task.due_date.date_type == :day
    end)
  end

  defp create_test_task_with_due_date(creator, milestone, due_date) do
    {:ok, task} = Repo.insert(%Task{
      name: "Test Task #{System.unique_integer()}",
      description: %{"message" => "Test task description"},
      deprecated_due_date: due_date,
      creator_id: creator.id,
      milestone_id: milestone.id,
      status: "todo"
    })

    task
  end

  defp create_test_task_without_due_date(creator, milestone) do
    {:ok, task} = Repo.insert(%Task{
      name: "Test Task Without Due Date #{System.unique_integer()}",
      description: %{"message" => "Test task description"},
      deprecated_due_date: nil,
      creator_id: creator.id,
      milestone_id: milestone.id,
      status: "todo"
    })

    task
  end
end
