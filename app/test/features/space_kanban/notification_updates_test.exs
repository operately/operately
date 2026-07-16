defmodule Operately.Features.SpaceKanban.NotificationUpdatesTest do
  use Operately.FeatureCase
  @moduletag login_as: :creator

  alias Operately.Support.Features.SpaceKanbanSteps, as: Steps
  alias Operately.Support.Time

  setup ctx, do: Steps.setup(ctx)

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
