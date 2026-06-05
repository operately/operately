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

  feature "commenting on a space task sends notification and email to the assignee", ctx do
    assignee_name = ctx.teammate.full_name
    comment_text = "This is a test comment on the space task."

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_assignee(assignee_name: assignee_name)
    |> Steps.add_comment_on_task(comment: comment_text)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "commented on #{ctx.task.name}",
      long_title: "commented on #{ctx.task.name} in the #{ctx.space.name} space"
    )
    |> Steps.assert_comment_notification_sent(to: :teammate, task_name: ctx.task.name)
    |> Steps.assert_comment_email_sent(to: :teammate, task_name: ctx.task.name)
  end

  feature "mentioning a person in task description sends notification and email with 'mentioned' subject", ctx do
    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(person: ctx.teammate)
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of #{ctx.task.name}",
      long_title: "updated the description of #{ctx.task.name} in #{ctx.space.name}"
    )
    |> Steps.assert_description_change_notification_sent(to: :teammate, task_name: ctx.task.name)
    |> Steps.assert_description_change_mentioned_email_sent(to: :teammate, task_name: ctx.task.name)
  end

  feature "updating task description for assigned person sends notification with 'updated' subject", ctx do
    assignee_name = ctx.teammate.full_name

    ctx
    |> Steps.visit_kanban_page()
    |> Steps.open_task_slide_in(:task)
    |> Steps.change_task_assignee(assignee_name: assignee_name)
    |> Steps.close_task_slide_in(:task)
    |> Steps.open_task_slide_in(:task)
    |> Steps.add_task_description(content: "Updated task description without mentions")
    |> Steps.close_task_slide_in(:task)
    |> Steps.assert_activity_in_space_and_company_feeds(
      title: "updated the description of #{ctx.task.name}",
      long_title: "updated the description of #{ctx.task.name} in #{ctx.space.name}"
    )
    |> Steps.assert_description_change_notification_sent(to: :teammate, task_name: ctx.task.name)
    |> Steps.assert_description_change_updated_email_sent(to: :teammate, task_name: ctx.task.name)
  end
end
