defmodule OperatelyWeb.Mcp.Tools.Milestones.UpdateTitleTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.UpdateTitle
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a milestone title" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{milestone: milestone}} =
             UpdateTitle.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "title" => "Renamed MCP Milestone"
             })

    assert milestone.title == "Renamed MCP Milestone"
    assert ToolConnHelper.reload(ctx.milestone).title == "Renamed MCP Milestone"
  end
end
