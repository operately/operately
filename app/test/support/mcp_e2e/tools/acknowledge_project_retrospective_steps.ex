defmodule Operately.Support.McpE2E.Tools.AcknowledgeProjectRetrospectiveSteps do
  use Operately.McpE2ECase

  alias OperatelyWeb.Paths

  step :given_project_retrospective, ctx do
    ctx
    |> Factory.add_company_member(:coworker)
    |> Factory.add_space(:space, name: "Retrospective Space")
    |> Factory.add_project(:project, :space, name: "Retrospective Project")
    |> Factory.add_project_retrospective(:retrospective, :project, :coworker)
  end

  step :call_acknowledge_project_retrospective, ctx do
    conn =
      call_tool(ctx.access_token, ctx.session_id, "acknowledge_project_retrospective", %{
        "retrospective_id" => Paths.project_retrospective_id(ctx.retrospective)
      })

    Map.put(ctx, :tool_conn, conn)
  end

  step :assert_project_retrospective_acknowledged, ctx do
    body = json_body(ctx.tool_conn)
    retrospective = body["result"]["structuredContent"]["retrospective"]

    assert ctx.tool_conn.status == 200
    assert retrospective["id"] == Paths.project_retrospective_id(ctx.retrospective)
    assert is_binary(retrospective["acknowledged_at"])
    assert retrospective["acknowledged_by"]["id"] == Paths.person_id(ctx.creator)

    ctx
  end
end
