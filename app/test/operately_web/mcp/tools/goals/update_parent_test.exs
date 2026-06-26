defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateParentTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateParent
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 connects a goal to a parent goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal(:parent_goal, :space)

    assert {:ok, %{goal: goal}} =
             UpdateParent.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "parent_goal_id" => Paths.goal_id(ctx.parent_goal)
             })

    assert goal.id == Paths.goal_id(ctx.goal)
    assert ToolConnHelper.reload(ctx.goal).parent_goal_id == ctx.parent_goal.id
  end

  test "call/2 clears the goal parent when parent_goal_id is omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:goal, :space, parent_goal: :parent_goal)

    assert ctx.goal.parent_goal_id == ctx.parent_goal.id

    assert {:ok, %{goal: goal}} =
             UpdateParent.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal)
             })

    assert goal.id == Paths.goal_id(ctx.goal)
    assert is_nil(ToolConnHelper.reload(ctx.goal).parent_goal_id)
  end
end
