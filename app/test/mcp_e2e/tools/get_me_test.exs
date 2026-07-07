defmodule Operately.McpE2E.Tools.GetMeTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps
  alias Operately.Support.McpE2E.Tools.GetMeSteps, as: Steps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "get_me returns the authenticated person through CIMD OAuth", ctx do
    ctx
    |> AuthSteps.authenticate_via_cimd()
    |> Steps.call_get_me()
    |> Steps.assert_get_me_matches_creator()
  end
end
