defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a goal discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_discussion(:discussion, :goal)

    assert {:ok, %{}} =
             UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.goal_discussion_id(ctx.discussion),
               "title" => "Updated goal discussion",
               "content" => "Updated goal discussion content"
             })

    discussion = ToolConnHelper.reload(ctx.discussion)

    assert discussion.title == "Updated goal discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.message) == "Updated goal discussion content"
  end
end
