defmodule OperatelyWeb.Mcp.Tools.Milestones.UpdateDescriptionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.UpdateDescription
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a milestone description" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{milestone: milestone}} =
             UpdateDescription.call(ToolConnHelper.conn(ctx), %{
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "description" => "Updated milestone description"
             })

    assert milestone.id == Paths.milestone_id(ctx.milestone)
    assert ToolConnHelper.reload(ctx.milestone) |> Map.get(:description) |> ToolConnHelper.rich_text_to_string() == "Updated milestone description"
  end
end
