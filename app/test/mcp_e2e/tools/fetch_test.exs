defmodule Operately.McpE2E.Tools.FetchTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps
  alias Operately.Support.McpE2E.Tools.FetchSteps, as: Steps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "fetch returns project content through CIMD OAuth", ctx do
    ctx
    |> Steps.given_project()
    |> AuthSteps.authenticate_via_cimd()
    |> Steps.call_fetch()
    |> Steps.assert_fetch_project()
  end
end
