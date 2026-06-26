defmodule OperatelyWeb.Mcp.Tools.Goals.CreateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Comments.CommentThread
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.CreateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a goal discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{discussion: discussion, activity_id: activity_id}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "title" => "Goal discussion",
               "content" => "Goal discussion content"
             })

    assert activity_id

    discussion = Operately.Repo.get!(CommentThread, ToolConnHelper.decode_id!(discussion.id))

    assert discussion.title == "Goal discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.message) == "Goal discussion content"
  end
end
