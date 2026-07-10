defmodule Operately.McpE2E.Tools.AcknowledgeGoalRetrospectiveTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps
  alias Operately.Support.McpE2E.Tools.AcknowledgeGoalRetrospectiveSteps, as: Steps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "acknowledge_goal_retrospective acknowledges through CIMD OAuth with write scope", ctx do
    ctx
    |> Steps.given_goal_retrospective()
    |> AuthSteps.authenticate_via_cimd_with_write()
    |> Steps.call_acknowledge_goal_retrospective()
    |> Steps.assert_goal_retrospective_acknowledged()
  end
end
