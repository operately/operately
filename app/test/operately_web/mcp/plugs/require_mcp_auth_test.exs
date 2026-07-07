defmodule OperatelyWeb.Mcp.Plugs.RequireMcpAuthTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import OperatelyWeb.Mcp.ToolConnHelper

  alias OperatelyWeb.Mcp.Plugs.{RequireMcpAuth, ResolveCompany}

  setup do
    client = %{
      client_id: "https://client.example.com/oauth/client.json",
      client_name: "Example MCP Client",
      redirect_uris: ["https://client.example.com/callback"],
      token_endpoint_auth_method: "none"
    }

    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    Application.put_env(:operately, :mcp_oauth_clients, [client])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    account = account_fixture()
    company = company_fixture(%{company_name: "Plug Company"}, account)

    %{account: account, company: company, client: client}
  end

  test "assigns account, company, person, scopes, and auth mode", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)

    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> RequireMcpAuth.call([])
      |> ResolveCompany.call([])

    assert conn.assigns.api_auth_mode == :mcp_oauth
    assert conn.assigns.current_account.id == account.id
    assert conn.assigns.current_company.id == company.id
    assert conn.assigns.current_person.account_id == account.id
    assert conn.assigns.mcp_scopes == ["mcp:read"]
    assert conn.assigns.current_mcp_grant.company_id == company.id
  end
end
