defmodule Operately.Features.ProjectTasks.TaskCreationBoardTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :contributor

  feature "create task without milestone", ctx do
    attrs = %{
      name: "My task",
      assignee: ctx.champion.full_name,
      due_date: Operately.Support.Time.next_friday(),
      milestone: nil
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_milestone()
  end

  feature "create task without due date", ctx do
    attrs = %{
      name: "My task",
      assignee: ctx.champion.full_name,
      due_date: nil,
      milestone: ctx.milestone.title
    }

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.add_task_from_tasks_board(attrs)
    |> Steps.assert_task_added(attrs.name)
    |> Steps.go_to_task_page()
    |> Steps.assert_no_due_date()
  end

  feature "create task with due date, assignee and milestone", ctx do
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
end
