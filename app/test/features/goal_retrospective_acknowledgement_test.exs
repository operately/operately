defmodule Operately.Features.GoalRetrospectiveAcknowledgementTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalRetrospectiveAcknowledgementSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

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
