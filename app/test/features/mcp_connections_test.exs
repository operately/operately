defmodule Operately.Features.McpConnectionsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.McpConnectionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "navigate to MCP connections page from security page", ctx do
    ctx
    |> Steps.visit_security_page()
    |> Steps.click_manage_mcp_connections_link()
    |> Steps.assert_on_mcp_connections_page()
  end

  feature "revoke an MCP connection from the list", ctx do
    ctx
    |> Steps.given_an_mcp_grant_exists()
    |> Steps.visit_mcp_connections_page()
    |> Steps.assert_grant_appears_in_list()
    |> Steps.revoke_first_connection()
    |> Steps.assert_grant_removed_from_list()
  end
end
