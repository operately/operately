defmodule Operately.Features.ProjectTasks.TaskDescriptionTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: :contributor
  feature "edit task name", ctx do
    new_name = "New task name"
    feed_title = "changed the title of this task from \"My task\" to \"#{new_name}\""

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.refute_task_name(new_name)
    |> Steps.edit_task_name(new_name)
    |> Steps.assert_task_name(new_name)
    |> Steps.reload_task_page()
    |> Steps.assert_task_name(new_name)
    |> Steps.assert_change_in_feed(feed_title)
  end

  @tag login_as: :contributor
  feature "edit task description", ctx do
    new_description = "New task description"

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.refute_task_description(new_description)
    |> Steps.edit_task_description(new_description)
    |> Steps.assert_task_description(new_description)
    |> Steps.assert_change_in_feed("updated the description")
    |> Steps.reload_task_page()
    |> Steps.assert_task_description(new_description)
    |> Steps.assert_change_in_feed("updated the description")
  end

  @tag login_as: :contributor
  feature "task shows description indicator when description is added", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_description_indicator_not_visible()
    |> Steps.visit_task_page()
    |> Steps.edit_task_description("This is a task description")
    |> Steps.visit_project_page()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_description_indicator_visible()
  end

  @tag login_as: :contributor
  feature "mentioning a person in a task description sends notification and email with 'mentioned' subject", ctx do
    ctx =
      ctx
      |> Steps.given_task_exists()
      |> Steps.given_space_member_exists()
      |> Steps.assert_space_member_task_description_not_notified()

    ctx
    |> UI.login_as(ctx.contributor)
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_task_page()
    |> Steps.edit_task_description_mentioning(ctx.space_member)

    ctx
    |> Steps.assert_space_member_task_description_notification_sent()
    |> Steps.assert_space_member_task_description_mentioned_email_sent()
  end

  @tag login_as: :contributor
  feature "updating task description for subscribed person sends notification with 'updated' subject", ctx do
    ctx =
      ctx
      |> Steps.given_task_exists()
      |> Steps.given_space_member_exists()

    ctx
    |> Steps.login_as_space_member()
    |> Steps.visit_task_page()
    |> Steps.subscribe_to_task()
    |> Steps.login_as_contributor()
    |> Steps.visit_task_page()
    |> Steps.edit_task_description("Updated task description without mentions")

    ctx
    |> Steps.assert_space_member_task_description_notification_sent()
    |> Steps.assert_space_member_task_description_updated_email_sent()
  end

  @tag login_as: :contributor
  feature "mentioning a person in task description automatically subscribes them to task", ctx do
    ctx =
      ctx
      |> Steps.given_task_exists()
      |> Steps.given_space_member_exists()

    ctx
    |> Steps.login_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_task_page()
    |> Steps.edit_task_description_mentioning(ctx.space_member)
    |> Steps.login_as_space_member()
    |> Steps.visit_task_page()
    |> Steps.assert_subscribed_to_task()
  end
end
