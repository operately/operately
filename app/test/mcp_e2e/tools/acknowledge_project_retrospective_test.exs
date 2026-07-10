defmodule Operately.McpE2E.Tools.AcknowledgeProjectRetrospectiveTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps
  alias Operately.Support.McpE2E.Tools.AcknowledgeProjectRetrospectiveSteps, as: Steps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "acknowledge_project_retrospective acknowledges through CIMD OAuth with write scope", ctx do
    ctx
    |> Steps.given_project_retrospective()
    |> AuthSteps.authenticate_via_cimd_with_write()
    |> Steps.call_acknowledge_project_retrospective()
    |> Steps.assert_project_retrospective_acknowledged()
  end
end
