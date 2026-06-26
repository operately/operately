defmodule OperatelyWeb.Mcp.Tools.Goals.CloseTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.Close
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 closes a goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{goal: goal}} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "success_status" => "achieved",
               "retrospective" => "Goal reached successfully"
             })

    assert goal.id == Paths.goal_id(ctx.goal)

    goal = ToolConnHelper.reload(ctx.goal)

    assert goal.closed_at
    assert goal.success_status == :achieved
  end
end
