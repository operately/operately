defmodule Operately.Support.McpE2E.Cimd.OnboardingSteps do
  use Operately.McpE2ECase

  step :with_invalid_cimd_document, ctx do
    Map.put(ctx, :cimd_document, cimd_document(%{"client_id" => "https://other.example.com/oauth/client.json"}))
  end

  step :list_tools, ctx do
    conn =
      post_mcp(ctx.access_token, ctx.session_id, %{
        "jsonrpc" => "2.0",
        "id" => "3",
        "method" => "tools/list"
      })

    Map.put(ctx, :tools_list_conn, conn)
  end

  step :assert_tools_match_catalog, ctx do
    body = json_body(ctx.tools_list_conn)
    tool_names = body["result"]["tools"] |> Enum.map(& &1["name"])

    assert ctx.tools_list_conn.status == 200
    assert tool_names == expected_tool_names()

    ctx
  end

  step :attempt_authorize, ctx do
    params = authorize_params()
    document = ctx.cimd_document

    conn =
      with_cimd_fetch(document, fn ->
        get(ctx.conn, "/oauth/authorize", params)
      end)

    Map.put(ctx, :authorize_conn, conn)
  end

  step :assert_invalid_client, ctx do
    assert ctx.authorize_conn.status == 400
    assert html_response(ctx.authorize_conn, 400) =~ "Invalid Client"

    ctx
  end
end
