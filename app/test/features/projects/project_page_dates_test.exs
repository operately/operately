defmodule Operately.Features.Projects.ProjectPageDatesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Test Project")
    |> Steps.setup_contributors()
    |> Steps.login()
  end

  @tag login_as: :contributor
  feature "edit project start date", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)
    formatted_date_in_feed = Operately.Support.Time.format_month_day_maybe_year(next_friday)

    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.edit_project_start_date(next_friday)
    |> Steps.assert_project_start_date(formatted_date)
    |> Steps.reload_project_page()
    |> Steps.assert_project_start_date(formatted_date)
    |> Steps.assert_project_start_date_change_visible_in_feed(formatted_date_in_feed)
  end

  @tag login_as: :contributor
  feature "edit project due date", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)
    formatted_date_in_feed = Operately.Support.Time.format_month_day_maybe_year(next_friday)

    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.edit_project_due_date(next_friday)
    |> Steps.assert_project_due_date(formatted_date)
    |> Steps.reload_project_page()
    |> Steps.assert_project_due_date(formatted_date)
    |> Steps.assert_project_due_date_change_visible_in_feed(formatted_date_in_feed)
    |> Steps.assert_project_due_date_notification_sent(formatted_date_in_feed)
    |> Steps.assert_project_due_date_set_email_sent()
  end

  @tag login_as: :contributor
  feature "edit project due date sends notification to champion", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.edit_project_due_date(next_friday)
    |> Steps.assert_project_due_date(formatted_date)
    |> Steps.assert_project_due_date_changed_notification_sent(formatted_date)
    |> Steps.assert_project_due_date_changed_email_sent()
  end

  @tag login_as: :contributor
  feature "remove project due date sends notification to champion", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.given_project_due_date_exists()
    |> Steps.visit_project_page()
    |> Steps.remove_project_due_date()
    |> Steps.assert_no_project_due_date()
    |> Steps.assert_project_due_date_removed_notification_sent()
    |> Steps.assert_project_due_date_removed_email_sent()
  end

  @tag login_as: :contributor
  feature "overdue project shows overdue message", ctx do
    three_days_ago = Date.utc_today() |> Date.add(-3)
    fifteen_days_ago = Date.utc_today() |> Date.add(-15)

    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.edit_project_due_date(three_days_ago)
    |> Steps.assert_project_overdue_message("Overdue by 3 days")
    |> Steps.edit_project_due_date(fifteen_days_ago)
    |> Steps.assert_project_overdue_message("Overdue by 2 weeks")
  end
end
