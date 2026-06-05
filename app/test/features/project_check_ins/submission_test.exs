defmodule Operately.Features.ProjectCheckIns.SubmissionTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectCheckInsCase

  feature "submitting a check-in", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.assert_check_in_submitted(values)
    |> Steps.assert_check_in_visible_on_project_page(values)
    |> Steps.assert_check_in_visible_on_feed(values)
    |> Steps.assert_email_sent_to_reviewer(values)
    |> Steps.assert_notification_sent_to_reviewer(values)
  end

  @tag has_reviewer: false
  feature "submitting a check-in when project has no reviewers", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.assert_check_in_submitted(values)
    |> Steps.assert_check_in_visible_on_project_page(values)
    |> Steps.assert_check_in_visible_on_feed(values)
    |> Steps.assert_email_is_sent_to_contributors()
  end

  feature "check-in page shows navigation breadcrumbs", ctx do
    values = %{status: "on_track", description: "Checking breadcrumbs."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.assert_navigation_elements_displayed()
  end

  feature "check-in status is displayed on the check-ins tab", ctx do
    values = %{status: "caution", description: "We're facing some challenges."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.visit_check_ins_tab()
    |> Steps.assert_check_in_status_displayed("caution")
  end

  feature "check-in title shows month and day on check-ins tab", ctx do
    values = %{status: "on_track", description: "This is a check-in."}
    today = Date.utc_today()
    month = Calendar.strftime(today, "%B")
    day = to_string(today.day)

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.visit_check_ins_tab()
    |> UI.assert_text("Check-In for #{month} #{day}", testid: "check-in-title")
  end

  feature "edit a submitted check-in", ctx do
    original_values = %{status: "on_track", description: "This is a check-in."}
    new_values = %{status: "caution", description: "This is an edited check-in."}

    ctx
    |> Steps.submit_check_in(original_values)
    |> Steps.assert_check_in_submitted(original_values)
    |> Steps.edit_check_in(new_values)
    |> Steps.assert_check_in_submitted(new_values)
  end
end
