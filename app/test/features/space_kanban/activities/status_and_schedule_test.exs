defmodule Operately.Features.SpaceKanban.Activities.StatusAndScheduleTest do
  use Operately.FeatureCase
  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps
  alias Operately.Support.Time

  setup ctx, do: Steps.setup(ctx)

  feature "changing a task status creates an activity", ctx do
    [old_status_value, new_status_value | _] = ctx.status_values

    old_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == old_status_value)).label
    new_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == new_status_value)).label

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_status(prev_status: old_status_label, next_status: new_status_value)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_task_in_status(task_key: :task, status_value: new_status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "marked #{ctx.task.name} as #{new_status_label}",
      long_title: "marked #{ctx.task.name} as #{new_status_label} in #{ctx.space.name}"
    )
  end

  feature "task-status-updating activity works after task is deleted", ctx do
    [old_status_value, new_status_value | _] = ctx.status_values

    old_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == old_status_value)).label
    new_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == new_status_value)).label
    task_display = "the \"#{ctx.task.name}\" task"

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_status(prev_status: old_status_label, next_status: new_status_value)
    |> Steps.close_task_slide_in(:task)
    |> Steps.reload_task(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :task, status_value: new_status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "marked #{task_display} as #{new_status_label}",
      long_title: "marked #{task_display} as #{new_status_label} in #{ctx.space.name}"
    )
  end

  feature "task-status-updating activity task link redirects to space kanban page", ctx do
    [old_status_value, new_status_value | _] = ctx.status_values

    old_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == old_status_value)).label
    new_status_label = Enum.find(ctx.space.task_statuses, &(&1.value == new_status_value)).label

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_status(prev_status: old_status_label, next_status: new_status_value)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_task_in_status(task_key: :task, status_value: new_status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "marked #{ctx.task.name} as #{new_status_label}",
      long_title: "marked #{ctx.task.name} as #{new_status_label} in #{ctx.space.name}"
    )
    |> Steps.click_task_link_in_space_feed(task_name: ctx.task.name)
    |> Steps.assert_space_kanban_page_open()
  end

  feature "changing a task due date creates an activity", ctx do
    due_date = Time.next_friday()
    due_label = Time.format_month_day(due_date)
    due_label_in_feed = Time.format_month_day_maybe_year(due_date)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_due_date(date: due_date)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_card_due_date(task_key: :task, label: due_label)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name}",
      long_title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name} in #{ctx.space.name}"
    )
  end

  feature "task-due-date-updating activity works after task is deleted", ctx do
    status_value = hd(ctx.status_values)
    due_date = Time.next_friday()
    due_label_in_feed = Time.format_month_day_maybe_year(due_date)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_due_date(date: due_date)
    |> Steps.close_task_slide_in(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.delete_task()
    |> Steps.assert_task_removed(task_key: :task, status_value: status_value)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name}",
      long_title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name} in #{ctx.space.name}"
    )
  end
end
