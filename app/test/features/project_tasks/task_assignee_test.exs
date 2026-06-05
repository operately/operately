defmodule Operately.Features.ProjectTasks.TaskAssigneeTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: :contributor
  feature "edit task assignee", ctx do
    feed_title = "assigned this task to #{Operately.People.Person.short_name(ctx.champion)}"

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_no_assignee()
    |> Steps.edit_task_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.assert_task_assignee_change_visible_in_feed()
  end

  @tag login_as: :contributor
  feature "edit task assignee sends notification to assignee", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_no_assignee()
    |> Steps.edit_task_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee_changed_notification_sent()
    |> Steps.assert_assignee_changed_email_sent()
  end

  @tag login_as: :contributor
  feature "updating task assignee automatically subscribes assignee", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_no_assignee()
    |> Steps.edit_task_assignee(ctx.champion.full_name)
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.login_as_champion()
    |> Steps.visit_task_page()
    |> Steps.assert_subscribed_to_task()
  end

  @tag login_as: :contributor
  feature "remove task assignee sends notification to assignee", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_assignee(ctx.champion.full_name)
    |> Steps.remove_task_assignee()
    |> Steps.assert_assignee_removed_notification_sent()
    |> Steps.assert_assignee_removed_email_sent()
  end
end
