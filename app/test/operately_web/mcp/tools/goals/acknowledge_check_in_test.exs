defmodule OperatelyWeb.Mcp.Tools.Goals.AcknowledgeCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.AcknowledgeCheckIn
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 acknowledges a goal check-in" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:check_in, :goal, :creator)

    assert {:ok, %{update: update}} =
             AcknowledgeCheckIn.call(ToolConnHelper.conn(ctx), %{
               "check_in_id" => Paths.goal_update_id(ctx.check_in)
             })

    assert update.id == Paths.goal_update_id(ctx.check_in)
  end
end
