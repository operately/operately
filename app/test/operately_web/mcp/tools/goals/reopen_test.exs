defmodule OperatelyWeb.Mcp.Tools.Goals.ReopenTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.Reopen
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 reopens a closed goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.close_goal(:goal)

    assert {:ok, %{goal: goal}} =
             Reopen.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "message" => "Goal needs more work"
             })

    assert goal.id == Paths.goal_id(ctx.goal)
    assert is_nil(ToolConnHelper.reload(ctx.goal).closed_at)
  end
end
