defmodule OperatelyWeb.Mcp.Tools.Spaces.PublishDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.PublishDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 publishes a draft space discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_draft_message(:discussion, :board)

    assert {:ok, %{discussion: discussion}} =
             PublishDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.message_id(ctx.discussion)
             })

    assert discussion.id == Paths.message_id(ctx.discussion)
    assert ToolConnHelper.reload(ctx.discussion).state == :published
  end
end
