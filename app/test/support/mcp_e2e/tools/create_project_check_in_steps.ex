defmodule Operately.Support.McpE2E.Tools.CreateProjectCheckInSteps do
  use Operately.McpE2ECase

  alias OperatelyWeb.Paths

  step :given_project, ctx do
    ctx
    |> Factory.add_space(:space, name: "Check-in Space")
    |> Factory.add_project(:project, :space, name: "Check-in Project")
  end

  step :call_create_project_check_in, ctx do
    conn =
      call_tool(ctx.access_token, ctx.session_id, "create_project_check_in", %{
        "project_id" => Paths.project_id(ctx.project),
        "status" => "on_track",
        "content" => "Project update from MCP E2E"
      })

    Map.put(ctx, :tool_conn, conn)
  end

  step :assert_check_in_created, ctx do
    body = json_body(ctx.tool_conn)

    assert ctx.tool_conn.status == 200
    assert body["result"]["structuredContent"]["check_in"]["status"] == "on_track"
    assert is_binary(body["result"]["structuredContent"]["check_in"]["id"])

    ctx
  end
end
