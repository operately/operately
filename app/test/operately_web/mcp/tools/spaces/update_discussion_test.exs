defmodule OperatelyWeb.Mcp.Tools.Spaces.UpdateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.UpdateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a space discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)

    assert {:ok, %{discussion: discussion}} =
             UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.message_id(ctx.discussion),
               "title" => "Updated space discussion",
               "content" => "Updated space discussion content"
             })

    assert discussion.title == "Updated space discussion"

    discussion = ToolConnHelper.reload(ctx.discussion)

    assert discussion.title == "Updated space discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.body) == "Updated space discussion content"
  end
end
