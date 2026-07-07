defmodule OperatelyWeb.Api.McpGrantsTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import OperatelyWeb.Mcp.ToolConnHelper

  alias Operately.Mcp
  alias Operately.Mcp.Grant
  alias Operately.Repo
  alias OperatelyWeb.Paths

  @client %{
    client_id: "https://client.example.com/oauth/client.json",
    client_name: "Example MCP Client",
    redirect_uris: ["https://client.example.com/callback"],
    token_endpoint_auth_method: "none"
  }

  setup ctx do
    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    Application.put_env(:operately, :mcp_oauth_clients, [@client])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
  end

  describe "list mcp grants" do
    test "returns active grants for the current company", ctx do
      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Co"}, other_account)
      second_company = company_fixture(%{company_name: "Second Co"}, ctx.account)

      own_grant = insert_grant!(ctx.account, ctx.company)
      _other_company_grant = insert_grant!(ctx.account, second_company, client_id: "https://second-co.example.com/client.json")
      _other_grant = insert_grant!(other_account, other_company)

      assert {200, res} = query(ctx.conn, [:mcp_grants, :list], %{})

      ids = MapSet.new(Enum.map(res.mcp_grants, & &1.id))
      assert ids == MapSet.new([Paths.mcp_grant_id(own_grant)])

      [grant] = res.mcp_grants
      assert grant.client_name == "Example MCP Client"
      assert grant.scopes == ["mcp:read"]
      assert is_binary(grant.inserted_at)
    end

    test "returns empty list when account has no grants", ctx do
      assert {200, res} = query(ctx.conn, [:mcp_grants, :list], %{})

      assert res.mcp_grants == []
    end

    test "returns forbidden for token-auth mode", ctx do
      conn = Plug.Conn.assign(ctx.conn, :api_auth_mode, :api_token)

      assert {403, res} = query(conn, [:mcp_grants, :list], %{})

      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "revoke mcp grant" do
    test "revokes an owned grant", ctx do
      grant = insert_grant!(ctx.account, ctx.company)

      assert {200, res} = mutation(ctx.conn, [:mcp_grants, :revoke], %{id: Paths.mcp_grant_id(grant)})

      assert res.success == true

      grant = Repo.get!(Grant, grant.id)
      assert grant.revoked_at
    end

    test "returns not_found for another account's grant", ctx do
      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Co"}, other_account)
      grant = insert_grant!(other_account, other_company)

      assert {404, res} = mutation(ctx.conn, [:mcp_grants, :revoke], %{id: Paths.mcp_grant_id(grant)})

      assert res.message == "The requested resource was not found"
    end

    test "returns not_found for a grant in another company on the same account", ctx do
      second_company = company_fixture(%{company_name: "Second Co"}, ctx.account)
      grant = insert_grant!(ctx.account, second_company, client_id: "https://second-co.example.com/client.json")

      assert {404, res} = mutation(ctx.conn, [:mcp_grants, :revoke], %{id: Paths.mcp_grant_id(grant)})

      assert res.message == "The requested resource was not found"
    end

    test "returns forbidden for token-auth mode", ctx do
      conn = Plug.Conn.assign(ctx.conn, :api_auth_mode, :api_token)

      assert {403, res} = mutation(conn, [:mcp_grants, :revoke], %{id: Ecto.UUID.generate()})

      assert res.message == "You don't have permission to perform this action"
    end

    test "revoked grant rejects tools/call", ctx do
      %{access_token: access_token} = authorize_and_issue_tokens(ctx.account, ctx.company, @client)
      grant = fetch_grant!(ctx.account, ctx.company)

      {_initialize_conn, session_id} = initialize_session(access_token)

      assert {200, revoke_res} =
               mutation(ctx.conn, [:mcp_grants, :revoke], %{id: Paths.mcp_grant_id(grant)})

      assert revoke_res.success == true

      conn = call_tool(access_token, session_id, "get_me")

      assert conn.status == 401
    end
  end

  defp insert_grant!(account, company, attrs \\ []) do
    defaults = %{
      account_id: account.id,
      company_id: company.id,
      client_id: @client.client_id,
      client_name: @client.client_name,
      redirect_uri: hd(@client.redirect_uris),
      resource: Mcp.canonical_resource_uri(),
      scopes: ["mcp:read"]
    }

    %Grant{}
    |> Grant.changeset(Map.merge(defaults, Map.new(attrs)))
    |> Repo.insert!()
  end

  defp fetch_grant!(account, company) do
    Repo.get_by!(Grant, account_id: account.id, company_id: company.id, client_id: @client.client_id)
  end
end
