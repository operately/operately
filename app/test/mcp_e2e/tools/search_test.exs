defmodule Operately.McpE2E.Tools.SearchTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps
  alias Operately.Support.McpE2E.Tools.SearchSteps, as: Steps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "search finds workspace resources through CIMD OAuth", ctx do
    ctx
    |> Steps.given_searchable_workspace()
    |> AuthSteps.authenticate_via_cimd()
    |> Steps.call_search()
    |> Steps.assert_search_results()
  end
end
