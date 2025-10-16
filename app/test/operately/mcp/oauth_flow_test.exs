defmodule Operately.MCP.OAuthFlowTest do
  use OperatelyWeb.ConnCase, async: true

  alias Operately.Support.Factory
  alias Operately.MCP.{OAuth, URL}
  alias OperatelyWeb.Paths

  setup %{conn: conn} do
    ctx = Factory.setup(%{})
    conn = OperatelyWeb.ConnCase.log_in_account(conn, ctx.account, ctx.company)

    conn =
      conn
      |> refresh_conn()

    {:ok, conn: conn, ctx: ctx}
  end

  test "protected resource metadata exposes authorization server", %{conn: conn, ctx: ctx} do
    slug = Paths.company_id(ctx.company)
    response = get(conn, "/#{slug}/.well-known/oauth-protected-resource")

    assert json_response(response, 200) == %{
             "resource" => URL.resource_uri(conn, slug),
             "authorization_servers" => [URL.authorization_server_metadata_uri(conn, slug)],
             "bearer_token_methods_supported" => ["authorization_header"],
             "scopes_supported" => ["mcp"]
           }
  end

  test "authorization code flow issues access and refresh tokens", %{conn: conn, ctx: ctx} do
    slug = Paths.company_id(ctx.company)
    resource = URL.resource_uri(conn, slug)
    redirect_uri = "https://example.com/callback"
    client_id = "test-client"
    state = "abc123"
    code_verifier = Base.url_encode64(:crypto.strong_rand_bytes(32), padding: false)

    code_challenge =
      :crypto.hash(:sha256, code_verifier)
      |> Base.url_encode64(padding: false)

    authorize_path = "/#{slug}/mcp/oauth/authorize"

    conn =
      get(conn, authorize_path, %{
        "response_type" => "code",
        "client_id" => client_id,
        "redirect_uri" => redirect_uri,
        "code_challenge" => code_challenge,
        "code_challenge_method" => "S256",
        "resource" => resource,
        "state" => state,
        "scope" => "mcp"
      })

    assert html_response(conn, 200) =~ "Authorize MCP Access"

    csrf_token = Plug.CSRFProtection.get_csrf_token()

    conn =
      post(conn, authorize_path, %{
        "_csrf_token" => csrf_token,
        "decision" => "approve",
        "response_type" => "code",
        "client_id" => client_id,
        "redirect_uri" => redirect_uri,
        "code_challenge" => code_challenge,
        "code_challenge_method" => "S256",
        "resource" => resource,
        "state" => state,
        "scope" => "mcp"
      })

    location = redirected_to(conn)
    assert location

    %URI{query: query} = URI.parse(location)
    params = URI.decode_query(query)
    assert params["state"] == state
    code = params["code"]
    assert code

    token_conn =
      conn
      |> refresh_conn()
      |> Plug.Conn.put_req_header("content-type", "application/x-www-form-urlencoded")

    token_response =
      post(token_conn, "/#{slug}/mcp/oauth/token", %{
        "grant_type" => "authorization_code",
        "client_id" => client_id,
        "code" => code,
        "code_verifier" => code_verifier,
        "redirect_uri" => redirect_uri,
        "resource" => resource
      })

    body = json_response(token_response, 200)
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "Bearer"
    assert body["resource"] == resource

    {:ok, account, company, person} = OAuth.verify_access_token(body["access_token"], resource)
    assert account.id == ctx.account.id
    assert company.id == ctx.company.id
    assert person.company_id == ctx.company.id
  end

  defp refresh_conn(conn) do
    conn
    |> recycle()
    |> Plug.Conn.put_req_header("accept", "application/json")
  end
end
