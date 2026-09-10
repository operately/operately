defmodule Operately.Features.GoalChecksIns.AcknowledgementTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalCheckInsSteps, as: Steps
  alias Operately.Support.Features.GoalAccessSteps
  alias Operately.Access.Binding

  setup ctx, do: Steps.setup(ctx)

  feature "the champion cannot acknowledge their own check-in", ctx do
    ctx
    |> Steps.given_a_check_in_exists()
    |> Steps.assert_acknowledge_button_hidden_for(:champion)
  end

  feature "the reviewer cannot acknowledge their own check-in", ctx do
    ctx
    |> Steps.given_a_reviewer_submitted_check_in()
    |> Steps.assert_acknowledge_button_hidden_for(:reviewer)
  end

  feature "an editor who is neither champion nor reviewer cannot acknowledge a check-in in the UI", ctx do
    ctx
    |> GoalAccessSteps.given_direct_access_member(access_level: Binding.edit_access())
    |> Steps.given_a_check_in_exists()
    |> Steps.assert_acknowledge_button_hidden_for(:member)
  end

  feature "acknowledge a check-in in the web app", ctx do
    ctx
    |> Steps.given_a_check_in_exists()
    |> Steps.acknowledge_check_in()
    |> Steps.assert_acknowledge_email_sent()
    |> Steps.assert_check_in_acknowledged_in_feed()
    |> Steps.assert_check_in_acknowledged_in_notifications()
  end

  feature "acknowledge a check-in from the email", ctx do
    params = %{
      status: "on_track",
      message: "Checking-in on my goal",
      targets: %{
        "First response time" => 20,
        "Increase feedback score to 90%" => 80
      }
    }

    ctx
    |> Steps.check_in(params)
    |> Steps.acknowledge_check_in_from_email()
    |> Steps.assert_acknowledge_email_sent()
    |> Steps.assert_check_in_acknowledged_in_feed()
    |> Steps.assert_check_in_acknowledged_in_notifications()
  end

  feature "acknowledge a check-in as a champion (reviewer submitted)", ctx do
    ctx
    |> Steps.given_a_reviewer_submitted_check_in()
    |> Steps.assert_acknowledge_button_visible_to_champion()
    |> Steps.acknowledge_check_in_from_email_as_champion()
    |> Steps.assert_acknowledged_email_sent_to_reviewer()
  end
end
