defmodule Operately.Support.McpE2E.Tools.SearchSteps do
  use Operately.McpE2ECase

  alias OperatelyWeb.Paths

  @search_token "Roadmap"

  step :given_searchable_workspace, ctx do
    ctx
    |> Factory.add_space(:space, name: "#{@search_token} Space")
    |> Factory.add_goal(:goal, :space, name: "#{@search_token} Goal")
    |> Factory.add_project(:project, :space, name: "#{@search_token} Project")
    |> Map.put(:search_query, @search_token)
  end

  step :call_search, ctx do
    conn = call_tool(ctx.access_token, ctx.session_id, "search", %{"query" => ctx.search_query})

    Map.put(ctx, :tool_conn, conn)
  end

  step :assert_search_results, ctx do
    body = json_body(ctx.tool_conn)

    assert ctx.tool_conn.status == 200

    space_ids = Enum.map(body["result"]["structuredContent"]["spaces"], & &1["id"])
    project_ids = Enum.map(body["result"]["structuredContent"]["projects"], & &1["id"])
    goal_ids = Enum.map(body["result"]["structuredContent"]["goals"], & &1["id"])

    assert Paths.space_id(ctx.space) in space_ids
    assert Paths.project_id(ctx.project) in project_ids
    assert Paths.goal_id(ctx.goal) in goal_ids

    ctx
  end
end
