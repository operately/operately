defmodule OperatelyWeb.Mcp.Tools.Spaces.ArchiveDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.ArchiveDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 archives a published space discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)

    assert {:ok, %{success: true}} =
             ArchiveDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.message_id(ctx.discussion)
             })

    assert Operately.Repo.get!(Operately.Messages.Message, ctx.discussion.id, with_deleted: true).deleted_at
  end
end
