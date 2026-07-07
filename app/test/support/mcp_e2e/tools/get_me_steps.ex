defmodule Operately.Support.McpE2E.Tools.GetMeSteps do
  use Operately.McpE2ECase

  alias OperatelyWeb.Paths

  step :call_get_me, ctx do
    conn = call_tool(ctx.access_token, ctx.session_id, "get_me")

    Map.put(ctx, :tool_conn, conn)
  end

  step :assert_get_me_matches_creator, ctx do
    body = json_body(ctx.tool_conn)

    assert ctx.tool_conn.status == 200
    assert body["result"]["structuredContent"]["me"]["id"] == Paths.person_id(ctx.creator)

    ctx
  end
end
