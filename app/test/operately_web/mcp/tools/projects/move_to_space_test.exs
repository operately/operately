defmodule OperatelyWeb.Mcp.Tools.Projects.MoveToSpaceTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.MoveToSpace
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 moves a project to another space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space(:target_space, name: "Target Space")
      |> Factory.add_project(:project, :space)

    assert {:ok, %{success: true}} =
             MoveToSpace.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "space_id" => Paths.space_id(ctx.target_space)
             })

    assert ToolConnHelper.reload(ctx.project).group_id == ctx.target_space.id
  end
end
