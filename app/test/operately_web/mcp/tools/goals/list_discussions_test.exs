defmodule OperatelyWeb.Mcp.Tools.Goals.ListDiscussionsTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Goals.ListDiscussions
  alias OperatelyWeb.Paths

  test "call/2 returns discussions for one goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_discussion(:discussion, :goal)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{discussions: discussions}} = ListDiscussions.call(conn, %{"goal_id" => Paths.goal_id(ctx.goal)})
    assert Enum.map(discussions, & &1.id) == [Paths.goal_discussion_id(ctx.discussion)]
  end
end
