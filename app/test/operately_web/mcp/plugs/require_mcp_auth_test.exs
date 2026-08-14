defmodule OperatelyWeb.Mcp.Plugs.RequireMcpAuthTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import OperatelyWeb.Mcp.ToolConnHelper

  alias Operately.Mcp.{AccessToken, Token}
  alias Operately.People
  alias Operately.Repo
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

  test "returns a discovery challenge when the bearer token is missing" do
    conn = RequireMcpAuth.call(build_conn(), [])

    assert conn.status == 401
    assert_discovery_challenge(conn)
  end

  test "returns invalid_token when the bearer token is unknown" do
    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer opma_unknown")
      |> RequireMcpAuth.call([])

    assert conn.status == 401
    assert_invalid_token_challenge(conn)
  end

  test "returns invalid_token when the access token is expired", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    expire_access_token!(access_token)

    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> RequireMcpAuth.call([])

    assert conn.status == 401
    assert_invalid_token_challenge(conn)
  end

  test "returns invalid_token when the access token is revoked", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    revoke_access_token!(access_token)

    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> RequireMcpAuth.call([])

    assert conn.status == 401
    assert_invalid_token_challenge(conn)
  end

  test "returns invalid_token when the token is bound to another resource", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    rebind_access_token_resource!(access_token, "https://other.example.com/mcp")

    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> RequireMcpAuth.call([])

    assert conn.status == 401
    assert_invalid_token_challenge(conn)
  end

  test "returns invalid_token when company membership is revoked", %{account: account, company: company, client: client} do
    %{access_token: access_token} = authorize_and_issue_tokens(account, company, client)
    person = People.get_person(account, company)
    {:ok, _} = People.update_person(person, %{suspended: true, suspended_at: DateTime.utc_now()})

    conn =
      build_conn()
      |> put_req_header("authorization", "Bearer #{access_token}")
      |> RequireMcpAuth.call([])
      |> ResolveCompany.call([])

    assert conn.status == 401
    assert_invalid_token_challenge(conn)
  end

  defp expire_access_token!(raw_token) do
    update_access_token!(raw_token, expires_at: DateTime.add(Token.now(), -60, :second))
  end

  defp revoke_access_token!(raw_token) do
    update_access_token!(raw_token, revoked_at: Token.now())
  end

  defp rebind_access_token_resource!(raw_token, resource) do
    update_access_token!(raw_token, resource: resource)
  end

  defp update_access_token!(raw_token, attrs) do
    AccessToken
    |> Repo.get_by!(token_hash: Token.hash(raw_token))
    |> AccessToken.changeset(Map.new(attrs))
    |> Repo.update!()
  end

  defp assert_discovery_challenge(conn) do
    challenge = www_authenticate(conn)

    assert challenge =~ "resource_metadata="
    assert challenge =~ ~s(scope="mcp:read")
    refute challenge =~ "error="
  end

  defp assert_invalid_token_challenge(conn) do
    challenge = www_authenticate(conn)

    assert challenge =~ ~s(error="invalid_token")
    assert challenge =~ "resource_metadata="
    assert challenge =~ ~s(scope="mcp:read")
  end

  defp www_authenticate(conn) do
    conn |> get_resp_header("www-authenticate") |> List.first()
  end
end
