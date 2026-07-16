defmodule Operately.Features.SpaceKanban.NotificationsTest do
  use Operately.FeatureCase
  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps
  alias Operately.Support.Time

  setup ctx, do: Steps.setup(ctx)

  feature "changing a task assignee sends notification and email to the new assignee", ctx do
    assignee_name = ctx.teammate.full_name

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_assignee(assignee_name: assignee_name)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_card_assignee(task_key: :task, assignee_name: assignee_name)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "assigned to #{assignee_name} the task #{ctx.task.name}",
      long_title: "assigned to #{assignee_name} the task #{ctx.task.name} in #{ctx.space.name}"
    )
    |> Steps.assert_assignee_change_notification_sent(to: :teammate)
    |> Steps.assert_assignee_change_email_sent(to: :teammate)
  end

  feature "changing a task due date sends notification and email to the assignee", ctx do
    assignee_name = ctx.teammate.full_name
    due_date = Time.next_friday()
    due_label = Time.format_month_day(due_date)
    due_label_in_feed = Time.format_month_day_maybe_year(due_date)

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_assignee(assignee_name: assignee_name)
    |> Steps.close_task_slide_in(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_due_date(date: due_date)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_card_due_date(task_key: :task, label: due_label)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name}",
      long_title: "changed the due date to #{due_label_in_feed} on #{ctx.task.name} in #{ctx.space.name}"
    )
    |> Steps.assert_due_date_change_notification_sent(to: :teammate, task_name: ctx.task.name)
    |> Steps.assert_due_date_change_email_sent(to: :teammate, task_name: ctx.task.name)
  end
end
