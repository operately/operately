defmodule OperatelyWeb.Mcp.Tools.Goals.ListCheckInsTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Goals.ListCheckIns
  alias OperatelyWeb.Paths

  test "call/2 returns check-ins for one goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:check_in, :goal, :creator)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{check_ins: check_ins}} = ListCheckIns.call(conn, %{"goal_id" => Paths.goal_id(ctx.goal)})
    assert Enum.map(check_ins, & &1.id) == [Paths.goal_update_id(ctx.check_in)]
  end
end
