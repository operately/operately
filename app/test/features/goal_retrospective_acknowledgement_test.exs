defmodule Operately.Features.GoalRetrospectiveAcknowledgementTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalRetrospectiveAcknowledgementSteps, as: Steps
  alias Operately.Support.Features.GoalAccessSteps
  alias Operately.Access.Binding

  setup ctx, do: Steps.setup(ctx)

  feature "the champion cannot acknowledge their own retrospective", ctx do
    ctx
    |> Steps.close_goal_as_champion()
    |> Steps.assert_acknowledge_button_hidden_for(:champion)
  end

  feature "the reviewer cannot acknowledge their own retrospective", ctx do
    ctx
    |> Steps.given_a_reviewer_submitted_retrospective()
    |> Steps.assert_acknowledge_button_hidden_for(:reviewer)
  end

  feature "an editor who is neither champion nor reviewer cannot acknowledge a retrospective in the UI", ctx do
    ctx
    |> GoalAccessSteps.given_direct_access_member(access_level: Binding.edit_access())
    |> Steps.close_goal_as_champion()
    |> Steps.assert_acknowledge_button_hidden_for(:member)
  end

  feature "acknowledge a goal retrospective in the web app", ctx do
    ctx
    |> Steps.close_goal_as_champion()
    |> Steps.acknowledge_retrospective_as_reviewer()
    |> Steps.assert_retrospective_acknowledged()
    |> Steps.assert_acknowledgement_email_sent()
    |> Steps.assert_acknowledgement_notification_sent()
    |> Steps.assert_acknowledgement_visible_on_feed()
  end

  feature "acknowledge a goal retrospective from the email", ctx do
    ctx
    |> Steps.close_goal_as_champion()
    |> Steps.acknowledge_retrospective_from_email()
    |> Steps.assert_retrospective_acknowledged()
  end
end
