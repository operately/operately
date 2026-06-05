defmodule Operately.Features.ProjectTasks.ManagementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

  @tag login_as: :reviewer
  feature "task page hides space navigation when space is not accessible", ctx do
    ctx
    |> Steps.given_task_exists()
    |> ProjectSteps.given_company_members_cannot_access_space()
    |> Steps.visit_task_page()
    |> Steps.assert_task_navigation_without_space()
  end

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

  @tag login_as: :contributor
  feature "edit task due date", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)
    formatted_date_in_feed = Operately.Support.Time.format_month_day_maybe_year(next_friday)
    feed_title = "changed the due date of this task from"

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.edit_task_due_date(next_friday)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.assert_task_due_date_change_visible_in_feed(formatted_date_in_feed)
  end

  @tag login_as: :contributor
  feature "edit task due date sends notification to assignee", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.edit_task_due_date(next_friday)
    |> Steps.assert_task_due_date(formatted_date)
    |> Steps.assert_due_date_changed_notification_sent(formatted_date)
    |> Steps.assert_due_date_changed_email_sent()
  end

  @tag login_as: :contributor
  feature "remove task due date sends notification to assignee", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_assignee_exists()
    |> Steps.visit_task_page()
    |> Steps.remove_task_due_date()
    |> Steps.assert_no_due_date()
    |> Steps.assert_due_date_removed_notification_sent()
    |> Steps.assert_due_date_changed_email_sent()
  end

  @tag login_as: :contributor
  feature "edit task milestone", ctx do
    ctx =
      ctx
      |> Steps.assert_contributor_has_edit_access()
      |> Steps.given_task_exists()
      |> Steps.given_another_milestone_exists()

    feed_title = "attached this task to milestone #{ctx.another_milestone.title}"

    ctx
    |> Steps.visit_task_page()
    |> Steps.edit_task_milestone(ctx.another_milestone.title)
    |> Steps.assert_task_milestone(ctx.another_milestone.title)
    |> Steps.assert_change_in_feed(feed_title)
    |> Steps.reload_task_page()
    |> Steps.assert_task_milestone(ctx.another_milestone.title)
    |> Steps.assert_change_in_feed(feed_title)
  end

  @tag login_as: :contributor
  feature "delete task", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.delete_task()
    |> Steps.go_to_tasks_tab()
    |> Steps.assert_task_not_present()
  end

  @tag login_as: :contributor
  feature "complete task from header checkbox", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.complete_task_from_header_checkbox()
    |> Steps.assert_task_marked_completed()
  end

  @tag login_as: :contributor
  feature "header checkbox is hidden when there is no green status", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.given_project_has_no_completed_status()
    |> Steps.visit_task_page()
    |> Steps.assert_header_checkbox_hidden()
  end

  @tag login_as: :contributor
  feature "change task status from header selector", ctx do
    ctx
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_task_exists()
    |> Steps.visit_task_page()
    |> Steps.assert_task_status_in_header("Not started")
    |> Steps.change_task_status_from_header_selector("in_progress")
    |> Steps.assert_task_status_in_header("In progress")
    |> Steps.assert_task_status_value("in_progress")
  end
end
