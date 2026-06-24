defmodule OperatelyWeb.McpOAuthControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Mcp

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

    assert html_response(conn, 200) =~ "Authorize MCP Client"
    assert html_response(conn, 200) =~ "Solo Company"
    refute html_response(conn, 200) =~ "localhost redirect URI"
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

  test "rotates refresh tokens and rejects replay", %{conn: conn, client: client} do
    account = account_fixture()
    company = company_fixture(%{company_name: "Rotations LLC"}, account)
    conn = log_in_account(conn, account, company)

    %{refresh_token: refresh_token} = authorize_and_issue_tokens(conn, client)

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
  end

  defp authorize_params(client, redirect_uri) do
    %{
      "client_id" => client.client_id,
      "redirect_uri" => redirect_uri,
      "resource" => Mcp.canonical_resource_uri(),
      "scope" => "mcp:read",
      "state" => "oauth-state",
      "code_challenge" => pkce_challenge(),
      "code_challenge_method" => "S256"
    }
  end

  defp authorize_and_issue_tokens(conn, client) do
    params = authorize_params(client, hd(client.redirect_uris))
    consent_conn = get(conn, "/oauth/authorize", params)
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

    Jason.decode!(token_conn.resp_body, keys: :atoms)
  end

  defp csrf_token(conn) do
    {:ok, document} = Floki.parse_document(conn.resp_body)

    document
    |> Floki.find("input[name=\"_csrf_token\"]")
    |> Floki.attribute("value")
    |> List.first()
  end

  defp pkce_challenge do
    :crypto.hash(:sha256, "test-verifier")
    |> Base.url_encode64(padding: false)
  end
end
