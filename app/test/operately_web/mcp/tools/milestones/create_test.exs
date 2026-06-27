defmodule OperatelyWeb.Mcp.Tools.Milestones.CreateTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.Milestone
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.Create
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a milestone" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{milestone: milestone}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => "MCP Milestone",
               "due_date" => "2026-08-15"
             })

    milestone = Operately.Repo.get!(Milestone, ToolConnHelper.decode_id!(milestone.id))

    assert milestone.title == "MCP Milestone"
    assert milestone.timeframe.contextual_end_date.date == ~D[2026-08-15]
  end
end
