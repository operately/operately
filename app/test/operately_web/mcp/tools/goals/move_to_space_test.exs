defmodule OperatelyWeb.Mcp.Tools.Goals.MoveToSpaceTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.MoveToSpace
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 moves a goal to another space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space(:target_space, name: "Target Space")
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{success: true}} =
             MoveToSpace.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "space_id" => Paths.space_id(ctx.target_space)
             })

    assert ToolConnHelper.reload(ctx.goal).group_id == ctx.target_space.id
  end
end
