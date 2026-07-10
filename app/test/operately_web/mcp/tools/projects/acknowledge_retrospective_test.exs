defmodule OperatelyWeb.Mcp.Tools.Projects.AcknowledgeRetrospectiveTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.AcknowledgeRetrospective
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 acknowledges a project retrospective" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)

    assert {:ok, %{retrospective: retrospective}} =
             AcknowledgeRetrospective.call(ToolConnHelper.conn_as(ctx, :coworker), %{
               "retrospective_id" => Paths.project_retrospective_id(ctx.retrospective)
             })

    assert retrospective.id == Paths.project_retrospective_id(ctx.retrospective)
  end
end
