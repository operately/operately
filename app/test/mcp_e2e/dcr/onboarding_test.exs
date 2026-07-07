defmodule Operately.McpE2E.Dcr.OnboardingTest do
  use Operately.McpE2ECase

  alias Operately.Support.McpE2E.AuthSteps, as: AuthSteps

  setup ctx do
    {:ok, AuthSteps.setup(ctx)}
  end

  test "dynamically registered client completes oauth and lists tools", ctx do
    redirect_uri = "http://127.0.0.1:54321/callback/cursor-test"

    register_conn =
      post(build_conn(), "/oauth/register", %{
        "client_name" => "Cursor",
        "redirect_uris" => [redirect_uri],
        "token_endpoint_auth_method" => "none"
      })

    assert register_conn.status == 201

    %{"client_id" => client_id} = json_body(register_conn)

    params =
      authorize_params("mcp:read")
      |> Map.merge(%{
        "client_id" => client_id,
        "redirect_uri" => redirect_uri
      })

    redirect_conn = approve_authorization(ctx.conn, params)
    code = authorization_code(redirect_conn)

    token_conn =
      recycle(redirect_conn)
      |> post("/oauth/token", %{
        "grant_type" => "authorization_code",
        "client_id" => client_id,
        "redirect_uri" => redirect_uri,
        "resource" => Operately.Mcp.canonical_resource_uri(),
        "code" => code,
        "code_verifier" => "test-verifier"
      })

    assert %{"access_token" => access_token} = json_body(token_conn)

    {_initialize_conn, session_id} = initialize_mcp_session(access_token)

    list_conn =
      post_mcp(access_token, session_id, %{
        "jsonrpc" => "2.0",
        "id" => "3",
        "method" => "tools/list"
      })

    body = json_body(list_conn)
    tool_names = body["result"]["tools"] |> Enum.map(& &1["name"])

    assert list_conn.status == 200
    assert tool_names == expected_tool_names()
  end

  test "rejects insecure redirect uris during registration" do
    conn =
      post(build_conn(), "/oauth/register", %{
        "client_name" => "Bad Client",
        "redirect_uris" => ["http://client.example.com/callback"],
        "token_endpoint_auth_method" => "none"
      })

    assert conn.status == 400
    assert %{"error" => "invalid_redirect_uri"} = json_body(conn)
  end
end
