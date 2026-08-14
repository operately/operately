defmodule OperatelyWeb.McpOAuthControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import OperatelyWeb.Mcp.ToolConnHelper, except: [authorize_params: 2, authorize_params: 3]
  import Ecto.Query

  alias Operately.Mcp
  alias Operately.Mcp.{AccessToken, Grant, RefreshToken, Session, Token}
  alias Operately.Repo
  alias OperatelyWeb.Mcp.ToolConnHelper

  setup do
    client = %{
      client_id: "https://client.example.com/oauth/client.json",
      client_name: "Example MCP Client",
      redirect_uris: [
        "https://client.example.com/callback",
        "http://localhost:4567/callback"
      ],
      token_endpoint_auth_method: "none"
    }

    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    Application.put_env(:operately, :mcp_oauth_clients, [client])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    %{client: client}
  end

  test "redirects unauthenticated users to log in", %{conn: conn, client: client} do
    params = authorize_params(client, client.redirect_uris |> hd())

    conn = get(conn, "/oauth/authorize", params)

    assert conn.status == 302
    assert redirected_to(conn) =~ "/log_in?redirect_to="
  end

  test "auto-selects a single company and renders consent", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Solo Company"}, account)
    conn = log_in_account(conn, account, company)

    conn = get(conn, "/oauth/authorize", authorize_params(client, hd(client.redirect_uris)))

    body = html_response(conn, 200)
    assert body =~ "Authorize MCP Client"
    assert body =~ "Solo Company"
    assert body =~ "View workspace data"
    refute body =~ "localhost redirect URI"
    refute body =~ "create, update, delete, and archive"
  end

  test "shows write scope warning on consent when mcp:write is requested", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Write Company"}, account)
    conn = log_in_account(conn, account, company)

    conn =
      get(conn, "/oauth/authorize", authorize_params(client, hd(client.redirect_uris), "mcp:read mcp:write"))

    body = html_response(conn, 200)
    assert body =~ "View workspace data"
    assert body =~ "Create, update, delete, and archive workspace content"
    assert body =~ "Write access lets this client create, update, delete, and archive content in your workspace."
  end

  test "defaults to read-only scope when scope is omitted", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Default Scope Co"}, account)
    conn = log_in_account(conn, account, company)
    params = authorize_params(client, hd(client.redirect_uris)) |> Map.delete("scope")

    consent_conn = get(conn, "/oauth/authorize", params)
    body = html_response(consent_conn, 200)
    assert body =~ "View workspace data"
    refute body =~ "Create, update, delete, and archive workspace content"

    csrf_token = csrf_token(consent_conn)

    redirect_conn =
      consent_conn
      |> recycle()
      |> post("/oauth/authorize", Map.merge(params, %{"decision" => "approve", "_csrf_token" => csrf_token}))

    code =
      redirect_conn
      |> redirected_to()
      |> URI.parse()
      |> Map.fetch!(:query)
      |> URI.decode_query()
      |> Map.fetch!("code")

    token_conn =
      redirect_conn
      |> recycle()
      |> post("/oauth/token", %{
        "grant_type" => "authorization_code",
        "client_id" => client.client_id,
        "redirect_uri" => hd(client.redirect_uris),
        "resource" => Mcp.canonical_resource_uri(),
        "code" => code,
        "code_verifier" => "test-verifier"
      })

    token_body = Jason.decode!(token_conn.resp_body)

    assert token_conn.status == 200
    assert token_body["scope"] == "mcp:read"
  end

  test "shows a company picker when the account belongs to multiple companies", %{conn: conn, client: client} do
    account = account_fixture()
    company_a = company_fixture(%{company_name: "Alpha Company"}, account)
    company_fixture(%{company_name: "Beta Company"}, account)
    conn = log_in_account(conn, account, company_a)

    conn = get(conn, "/oauth/authorize", authorize_params(client, hd(client.redirect_uris)))

    body = html_response(conn, 200)
    assert body =~ "Choose a Company"
    assert body =~ "Alpha Company"
    assert body =~ "Beta Company"
  end

  test "includes a localhost warning for localhost redirect URIs", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Local Company"}, account)
    conn = log_in_account(conn, account, company)

    conn = get(conn, "/oauth/authorize", authorize_params(client, "http://localhost:4567/callback"))

    assert html_response(conn, 200) =~ "localhost redirect URI"
  end

  test "approves authorization and exchanges a code for tokens", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Approvals Inc"}, account)
    conn = log_in_account(conn, account, company)
    params = authorize_params(client, hd(client.redirect_uris))

    consent_conn = get(conn, "/oauth/authorize", params)
    csrf_token = csrf_token(consent_conn)

    redirect_conn =
      consent_conn
      |> recycle()
      |> post("/oauth/authorize", Map.merge(params, %{"decision" => "approve", "_csrf_token" => csrf_token}))

    redirect_uri = redirected_to(redirect_conn)
    query = redirect_uri |> URI.parse() |> Map.fetch!(:query) |> URI.decode_query()

    assert query["state"] == params["state"]
    assert is_binary(query["code"])

    token_conn =
      redirect_conn
      |> recycle()
      |> post("/oauth/token", %{
        "grant_type" => "authorization_code",
        "client_id" => client.client_id,
        "redirect_uri" => hd(client.redirect_uris),
        "resource" => Mcp.canonical_resource_uri(),
        "code" => query["code"],
        "code_verifier" => "test-verifier"
      })

    token_body = Jason.decode!(token_conn.resp_body)

    assert token_conn.status == 200
    assert token_body["token_type"] == "Bearer"
    assert is_binary(token_body["access_token"])
    assert is_binary(token_body["refresh_token"])
    assert token_body["scope"] == "mcp:read"
  end

  test "denies authorization with a trusted redirect uri", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Denied Co"}, account)
    conn = log_in_account(conn, account, company)
    params = authorize_params(client, hd(client.redirect_uris))

    consent_conn = get(conn, "/oauth/authorize", params)
    csrf_token = csrf_token(consent_conn)

    redirect_conn =
      consent_conn
      |> recycle()
      |> post("/oauth/authorize", Map.merge(params, %{"decision" => "deny", "_csrf_token" => csrf_token}))

    redirect_uri = redirected_to(redirect_conn)
    query = redirect_uri |> URI.parse() |> Map.fetch!(:query) |> URI.decode_query()

    assert query["error"] == "access_denied"
    assert query["state"] == params["state"]
  end

  test "rejects invalid resources", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Target Co"}, account)
    conn = log_in_account(conn, account, company)

    conn =
      get(conn, "/oauth/authorize", %{
        "client_id" => client.client_id,
        "redirect_uri" => hd(client.redirect_uris),
        "resource" => "https://evil.example.com/mcp",
        "scope" => "mcp:read",
        "state" => "bad-resource",
        "code_challenge" => "abc123",
        "code_challenge_method" => "S256"
      })

    assert conn.status == 400
    assert html_response(conn, 400) =~ "Invalid Resource"
  end

  test "emits oauth observability for authorization failures", %{conn: conn, client: client} do
    handler_id = "mcp-oauth-authorize-#{System.unique_integer([:positive])}"
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:operately, :mcp, :oauth, :stop],
        fn _event, measurements, metadata, pid ->
          send(pid, {:oauth_telemetry, measurements, metadata})
        end,
        test_pid
      )

    on_exit(fn -> :telemetry.detach(handler_id) end)

    account = account_fixture()
    company = company_fixture(%{company_name: "Target Co"}, account)
    conn = log_in_account(conn, account, company)

    conn =
      get(conn, "/oauth/authorize", %{
        "client_id" => client.client_id,
        "redirect_uri" => hd(client.redirect_uris),
        "resource" => "https://evil.example.com/mcp",
        "scope" => "mcp:read",
        "state" => "bad-resource",
        "code_challenge" => "abc123",
        "code_challenge_method" => "S256"
      })

    assert conn.status == 400

    assert_receive {:oauth_telemetry, %{count: 1}, metadata}
    assert metadata.action == "authorize"
    assert metadata.result == "invalid_target_resource"
    assert metadata.client_id == client.client_id
  end

  test "rotates refresh tokens and revokes the grant family on replay", %{conn: _conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Rotations LLC"}, account)

    %{access_token: access_token, refresh_token: refresh_token} = authorize_and_issue_tokens(account, company, client)
    {_initialize_conn, _session_id} = initialize_session(access_token)

    first_refresh_conn =
      post(build_conn(), "/oauth/token", %{
        "grant_type" => "refresh_token",
        "client_id" => client.client_id,
        "refresh_token" => refresh_token,
        "resource" => Mcp.canonical_resource_uri()
      })

    first_refresh_body = Jason.decode!(first_refresh_conn.resp_body)

    assert first_refresh_conn.status == 200
    assert is_binary(first_refresh_body["refresh_token"])
    refute first_refresh_body["refresh_token"] == refresh_token

    replay_conn =
      post(build_conn(), "/oauth/token", %{
        "grant_type" => "refresh_token",
        "client_id" => client.client_id,
        "refresh_token" => refresh_token,
        "resource" => Mcp.canonical_resource_uri()
      })

    replay_body = Jason.decode!(replay_conn.resp_body)

    assert replay_conn.status == 400
    assert replay_body["error"] == "invalid_grant"

    grant = Repo.one!(from(g in Grant, where: g.account_id == ^account.id and g.company_id == ^company.id))
    assert grant.revoked_at

    assert Repo.all(from(t in AccessToken, where: t.grant_id == ^grant.id and is_nil(t.revoked_at))) == []
    assert Repo.all(from(t in RefreshToken, where: t.grant_id == ^grant.id and is_nil(t.revoked_at))) == []
    assert Repo.all(from(s in Session, where: s.grant_id == ^grant.id and is_nil(s.closed_at))) == []

    successor_refresh_conn =
      post(build_conn(), "/oauth/token", %{
        "grant_type" => "refresh_token",
        "client_id" => client.client_id,
        "refresh_token" => first_refresh_body["refresh_token"],
        "resource" => Mcp.canonical_resource_uri()
      })

    assert successor_refresh_conn.status == 400
    assert Jason.decode!(successor_refresh_conn.resp_body)["error"] == "invalid_grant"

    successor_mcp_conn =
      build_conn()
      |> put_req_header("accept", "application/json, text/event-stream")
      |> put_req_header("content-type", "application/json")
      |> put_req_header("authorization", "Bearer #{first_refresh_body["access_token"]}")
      |> post("/mcp", %{
        "jsonrpc" => "2.0",
        "id" => "1",
        "method" => "initialize",
        "params" => %{
          "protocolVersion" => Mcp.latest_protocol_version(),
          "capabilities" => %{},
          "clientInfo" => %{"name" => "Example Client", "version" => "1.0.0"}
        }
      })

    assert successor_mcp_conn.status == 401
  end

  test "expired refresh tokens fail without revoking the grant", %{conn: _conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Expiry LLC"}, account)

    %{refresh_token: refresh_token} = authorize_and_issue_tokens(account, company, client)

    RefreshToken
    |> Repo.get_by!(token_hash: Token.hash(refresh_token))
    |> RefreshToken.changeset(%{expires_at: DateTime.add(Token.now(), -60, :second)})
    |> Repo.update!()

    expired_conn =
      post(build_conn(), "/oauth/token", %{
        "grant_type" => "refresh_token",
        "client_id" => client.client_id,
        "refresh_token" => refresh_token,
        "resource" => Mcp.canonical_resource_uri()
      })

    assert expired_conn.status == 400
    assert Jason.decode!(expired_conn.resp_body)["error"] == "invalid_grant"

    grant = Repo.one!(from(g in Grant, where: g.account_id == ^account.id and g.company_id == ^company.id))
    refute grant.revoked_at
  end

  test "registers a dynamic oauth client", %{conn: conn} do
    conn =
      post(conn, "/oauth/register", %{
        "client_name" => "Cursor",
        "redirect_uris" => ["cursor://anysphere.cursor-mcp/oauth/callback"],
        "token_endpoint_auth_method" => "none"
      })

    assert conn.status == 201

    body = Jason.decode!(conn.resp_body)

    assert body["client_name"] == "Cursor"
    assert is_binary(body["client_id"])
    assert body["redirect_uris"] == ["cursor://anysphere.cursor-mcp/oauth/callback"]
    assert body["token_endpoint_auth_method"] == "none"
  end

  test "rejects dynamic registration with insecure redirect uris", %{conn: conn} do
    conn =
      post(conn, "/oauth/register", %{
        "client_name" => "Bad Client",
        "redirect_uris" => ["http://client.example.com/callback"],
        "token_endpoint_auth_method" => "none"
      })

    assert conn.status == 400
    assert %{"error" => "invalid_redirect_uri"} = Jason.decode!(conn.resp_body)
  end

  test "returns 429 when authorize requests exceed the rate limit", %{conn: conn, client: client} do
    ToolConnHelper.with_rate_limits(%{oauth_authorize: %{limit: 1, period_seconds: 60, keys: [:ip]}}, fn ->
      account = account_fixture()
      company = company_fixture(%{company_name: "Rate Limit Co"}, account)
      conn = log_in_account(conn, account, company)
      params = authorize_params(client, hd(client.redirect_uris))

      assert get(conn, "/oauth/authorize", params).status == 200

      limited_conn = get(conn, "/oauth/authorize", params)

      assert limited_conn.status == 429
      assert get_resp_header(limited_conn, "retry-after") != []
      body = html_response(limited_conn, 429)
      assert body =~ "Too Many Requests"
    end)
  end

  test "returns 429 when token requests exceed the rate limit", %{client: client} do
    ToolConnHelper.with_rate_limits(%{oauth_token: %{limit: 1, period_seconds: 60, keys: [:ip, :client_id]}}, fn ->
      token_params = %{
        "grant_type" => "refresh_token",
        "client_id" => client.client_id,
        "refresh_token" => "invalid-token",
        "resource" => Mcp.canonical_resource_uri()
      }

      assert post(build_conn(), "/oauth/token", token_params).status == 400
      limited_conn = post(build_conn(), "/oauth/token", token_params)

      assert limited_conn.status == 429
      assert get_resp_header(limited_conn, "retry-after") != []

      assert %{"error" => "temporarily_unavailable"} = Jason.decode!(limited_conn.resp_body)
    end)
  end

  defp authorize_params(client, redirect_uri, scope \\ "mcp:read") do
    ToolConnHelper.authorize_params(client, redirect_uri, scope)
    |> Map.put("state", "oauth-state")
  end
end
