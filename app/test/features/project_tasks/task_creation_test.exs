defmodule Operately.Features.ProjectTasks.TaskCreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :contributor

  feature "create task from milestone page", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.add_task_from_milestone_page("Task 1")
    |> Steps.assert_task_added("Task 1")
    |> Steps.open_task_slide_in("Task 1")
    |> Steps.assert_task_slide_in_open("Task 1")
  end

  feature "create task from tasks board", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    attrs = %{
      name: "Task 1",
      assignee: ctx.champion.full_name,
      due_date: next_friday,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_assignee(attrs.assignee)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_task_milestone(attrs.milestone)
  end

  feature "create task without assignee", ctx do
    attrs = %{
      name: "My task",
      assignee: nil,
      due_date: Operately.Support.Time.next_friday(),
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_assignee()
  end
end
