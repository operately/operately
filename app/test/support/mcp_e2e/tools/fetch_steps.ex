defmodule Operately.Support.McpE2E.Tools.FetchSteps do
  use Operately.McpE2ECase

  alias OperatelyWeb.Paths

  step :given_project, ctx do
    ctx
    |> Factory.add_space(:space, name: "Fetch Space")
    |> Factory.add_project(:project, :space, name: "Fetch Project")
  end

  step :call_fetch, ctx do
    url = Paths.to_url(Paths.project_path(ctx.company, ctx.project))

    conn = call_tool(ctx.access_token, ctx.session_id, "fetch", %{"url" => url})

    ctx
    |> Map.put(:tool_conn, conn)
    |> Map.put(:fetch_url, url)
  end

  step :assert_fetch_project, ctx do
    body = json_body(ctx.tool_conn)

    assert ctx.tool_conn.status == 200
    assert body["result"]["structuredContent"]["url"] == ctx.fetch_url
    assert body["result"]["structuredContent"]["resource"]["type"] == "project"
    assert body["result"]["structuredContent"]["resource"]["data"]["id"] == Paths.project_id(ctx.project)
    assert [%{"type" => "text", "text" => fetch_result_text}] = body["result"]["structuredContent"]["content"]
    assert is_binary(fetch_result_text)

    ctx
  end
end
