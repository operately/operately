defmodule Operately.Features.ProjectTasks.TaskScheduleAndMilestoneTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectTasksCase

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
end
