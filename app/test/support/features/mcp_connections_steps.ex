defmodule Operately.Support.Features.McpConnectionsSteps do
  use Operately.FeatureCase

  alias Operately.Mcp
  alias Operately.Mcp.Grant
  alias Operately.Repo
  alias OperatelyWeb.Paths

  @client_id "https://client.example.com/oauth/client.json"

  step :setup, ctx do
    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)

    Application.put_env(:operately, :mcp_oauth_clients, [
      %{
        client_id: @client_id,
        client_name: "Example MCP Client",
        redirect_uris: ["https://client.example.com/callback"],
        token_endpoint_auth_method: "none"
      }
    ])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
  end

  step :visit_security_page, ctx do
    ctx |> UI.visit(Paths.account_security_path(ctx.company))
  end

  step :click_manage_mcp_connections_link, ctx do
    ctx |> UI.click(testid: "manage-mcp-connections-link")
  end

  step :assert_on_mcp_connections_page, ctx do
    ctx |> UI.assert_has(testid: "account-mcp-connections-page")
  end

  step :given_an_mcp_grant_exists, ctx do
    %Grant{}
    |> Grant.changeset(%{
      account_id: ctx.account.id,
      company_id: ctx.company.id,
      client_id: @client_id,
      client_name: "Example MCP Client",
      redirect_uri: "https://client.example.com/callback",
      resource: Mcp.canonical_resource_uri(),
      scopes: ["mcp:read"]
    })
    |> Repo.insert!()

    ctx
  end

  step :visit_mcp_connections_page, ctx do
    ctx |> UI.visit(Paths.account_mcp_connections_path(ctx.company))
  end

  step :assert_grant_appears_in_list, ctx do
    ctx |> UI.assert_text("Example MCP Client")
  end

  step :revoke_first_connection, ctx do
    grant = Repo.get_by!(Grant, account_id: ctx.account.id, company_id: ctx.company.id, client_id: @client_id)
    grant_id = Paths.mcp_grant_id(grant)

    ctx
    |> UI.click(testid: UI.testid(["mcp-connection-actions-menu", grant_id]))
    |> UI.click(testid: UI.testid(["revoke-mcp-connection", grant_id]))
    |> UI.click(testid: "revoke-mcp-connection-confirm")
  end

  step :assert_grant_removed_from_list, ctx do
    ctx |> UI.refute_text("Example MCP Client")
  end
end
