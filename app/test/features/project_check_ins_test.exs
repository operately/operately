defmodule Operately.Features.ProjectCheckInsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectCheckInsSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.given_a_project_exists()
    |> Steps.log_in_as_champion()
  end

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

  feature "acknowledge a check-in in the web app", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.log_in_as_reviewer()
    |> Steps.open_check_in_from_notifications()
    |> Steps.acknowledge_check_in()
    |> Steps.assert_check_in_acknowledged(values)
    |> Steps.assert_acknowledgement_email_sent_to_champion(values)
    |> Steps.assert_acknowledgement_notification_sent_to_champion(values)
    |> Steps.assert_acknowledgement_visible_on_feed()
  end

  feature "acknowledge a check-in from the email", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.acknowledge_check_in_from_email(values)
    |> Steps.assert_check_in_acknowledged(values)
  end

  feature "leave a comment on an check-in", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.log_in_as_reviewer()
    |> Steps.open_check_in_from_notifications()
    |> Steps.leave_comment_on_check_in()
    |> Steps.assert_check_in_comment_visible_on_feed()
    |> Steps.assert_comment_on_check_in_received_in_notifications()
    |> Steps.assert_comment_on_check_in_received_in_email()
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

  feature "champion can acknowledge check-ins posted by reviewer", ctx do
    values = %{status: "on_track", description: "Check-in posted by reviewer."}

    ctx
    |> Steps.log_in_as_reviewer()
    |> Steps.submit_check_in(values)
    |> Steps.log_in_as_champion()
    |> Steps.open_check_in_from_notifications()
    |> Steps.acknowledge_check_in()
    |> Steps.assert_check_in_acknowledged(values)
    |> Steps.assert_acknowledgement_email_sent_to_reviewer(values)
  end

  feature "reviewer can acknowledge check-ins posted by champion", ctx do
    values = %{status: "caution", description: "Check-in posted by champion."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.log_in_as_reviewer()
    |> Steps.open_check_in_from_notifications()
    |> Steps.acknowledge_check_in()
    |> Steps.assert_check_in_acknowledged(values)
    |> Steps.assert_acknowledgement_email_sent_to_champion(values)
  end
end
