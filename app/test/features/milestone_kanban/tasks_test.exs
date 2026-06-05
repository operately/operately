defmodule Operately.Features.MilestoneKanban.TasksTest do
  use Operately.FeatureCase
  @moduletag login_as: :champion

  alias Operately.Support.Features.MilestoneKanbanSteps, as: Steps
  alias Operately.Support.Time

  setup ctx, do: Steps.setup(ctx)

  feature "add a task inline in a column", ctx do
    [primary_status | _] = ctx.status_values

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.add_inline_task(status_value: primary_status, title: "Inline Task")
    |> Steps.load_task_by_name(key: :inline_task, name: "Inline Task")
    |> Steps.assert_task_in_status(task_key: :inline_task, status_value: primary_status)
  end

  feature "edit task details in the slide-in and see updates on card and columns", ctx do
    [_primary_status | rest] = ctx.status_values
    new_status = hd(rest)
    due_date = Time.next_friday()
    due_label = Time.format_month_day(due_date)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: new_status)
    |> Steps.change_task_assignee(assignee_name: ctx.teammate.full_name)
    |> Steps.change_task_due_date(date: due_date)
    |> Steps.add_task_description(content: "Updated description for kanban flow.")
    |> Steps.close_task_slide_in(:second_task)
    |> Steps.assert_task_in_status(task_key: :second_task, status_value: new_status)
    |> Steps.assert_card_due_date(task_key: :second_task, label: due_label)
    |> Steps.assert_card_assignee(task_key: :second_task, assignee_name: ctx.teammate.full_name)
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.assert_description(content: "Updated description for kanban flow.")
  end

  feature "moving a task to another milestone updates the correct board", ctx do
    [_primary_status | rest] = ctx.status_values
    new_status = hd(rest)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: new_status)
    |> Steps.change_task_milestone(milestone_title: ctx.another_milestone.title)
    |> Steps.close_task_slide_in(:second_task)
    |> Steps.assert_task_absent_in_status(task_key: :second_task, status_value: new_status)
    |> Steps.visit_kanban_page_for(:another_milestone)
    |> Steps.assert_task_in_status(task_key: :second_task, status_value: new_status)
  end

  feature "delete a task from the slide-in", ctx do
    [_primary_status | rest] = ctx.status_values
    new_status = hd(rest)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:second_task)
    |> Steps.change_task_status(prev_status: "Not started", next_status: new_status)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :second_task, status_value: new_status)
  end
end
