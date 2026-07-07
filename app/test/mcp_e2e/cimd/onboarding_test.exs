defmodule Operately.McpE2E.Cimd.OnboardingTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps
  alias Operately.Support.McpE2E.Cimd.OnboardingSteps, as: Steps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "CIMD client lists tools without allowlist entry", ctx do
    ctx
    |> AuthSteps.authenticate_via_cimd()
    |> Steps.list_tools()
    |> Steps.assert_tools_match_catalog()
  end

  test "rejects authorize when CIMD fetch returns invalid metadata", ctx do
    ctx
    |> Steps.with_invalid_cimd_document()
    |> Steps.attempt_authorize()
    |> Steps.assert_invalid_client()
  end
end
