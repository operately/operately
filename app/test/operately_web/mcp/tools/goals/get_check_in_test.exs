defmodule OperatelyWeb.Mcp.Tools.Goals.GetCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Goals.GetCheckIn
  alias OperatelyWeb.Paths

  test "call/2 returns one check-in with comments" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:check_in, :goal, :creator)
      |> Factory.preload(:check_in, :goal)
      |> Factory.add_comment(:comment, :check_in)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{check_in: check_in}} = GetCheckIn.call(conn, %{"check_in_id" => Paths.goal_update_id(ctx.check_in)})
    assert check_in.id == Paths.goal_update_id(ctx.check_in)
    assert length(check_in.comments) == 1
  end
end
