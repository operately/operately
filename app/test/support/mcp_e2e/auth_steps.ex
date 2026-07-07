defmodule Operately.Support.McpE2E.AuthSteps do
  use Operately.McpE2ECase

  alias Operately.Mcp

  step :setup, ctx do
    setup_cimd_env()

    ctx
    |> Factory.setup()
    |> Factory.log_in_account(:account)
    |> Map.put(:cimd_document, cimd_document())
  end

  step :authenticate_via_cimd, ctx do
    run_cimd_authentication(ctx, "mcp:read")
  end

  step :authenticate_via_cimd_with_write, ctx do
    run_cimd_authentication(ctx, "mcp:read mcp:write")
  end

  # Authenticates via CIMD OAuth, exchanges the code for tokens, initializes an MCP session,
  # and stores the access token and session ID on ctx.
  defp run_cimd_authentication(ctx, scope) do
    params = authorize_params(scope)
    document = Map.get(ctx, :cimd_document, cimd_document())

    with_cimd_fetch(document, fn ->
      consent_conn = get(ctx.conn, "/oauth/authorize", params)
      assert html_response(consent_conn, 200) =~ "CIMD Integration Client"

      redirect_conn = approve_authorization(ctx.conn, params)
      code = authorization_code(redirect_conn)

      token_conn = exchange_authorization_code(redirect_conn, params, code)
      token_body = json_body(token_conn)

      assert token_conn.status == 200
      assert token_body["token_type"] == "Bearer"
      assert is_binary(token_body["access_token"])
      assert is_binary(token_body["refresh_token"])
      assert token_body["scope"] == scope

      access_token = token_body["access_token"]
      {initialize_conn, session_id} = initialize_mcp_session(access_token)
      initialize_body = json_body(initialize_conn)

      assert initialize_conn.status == 200
      assert initialize_body["result"]["protocolVersion"] == Mcp.latest_protocol_version()
      assert is_binary(session_id)

      ctx
      |> Map.put(:access_token, access_token)
      |> Map.put(:session_id, session_id)
      |> Map.put(:token_scope, scope)
    end)
  end
end
