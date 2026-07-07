defmodule Operately.McpE2E.Tools.CreateProjectCheckInTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps
  alias Operately.Support.McpE2E.Tools.CreateProjectCheckInSteps, as: Steps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "create_project_check_in creates a check-in through CIMD OAuth with write scope", ctx do
    ctx
    |> Steps.given_project()
    |> AuthSteps.authenticate_via_cimd_with_write()
    |> Steps.call_create_project_check_in()
    |> Steps.assert_check_in_created()
  end
end
