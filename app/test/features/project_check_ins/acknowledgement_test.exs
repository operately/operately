defmodule Operately.Features.ProjectCheckIns.AcknowledgementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectCheckInsCase

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
