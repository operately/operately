defmodule OperatelyWeb.Mcp.Tools.Comments.DeleteTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias Operately.Updates.Comment
  alias OperatelyWeb.Mcp.Tools.Comments.Delete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a space discussion comment" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)
      |> Factory.preload(:discussion, :space)
      |> Factory.add_comment(:comment, :discussion)

    assert {:ok, %{comment: comment}} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "comment_id" => Paths.comment_id(ctx.comment),
               "parent_type" => "space_discussion"
             })

    assert comment.id == Paths.comment_id(ctx.comment)
    refute Operately.Repo.get(Comment, ctx.comment.id)
  end

  test "returns invalid_arguments for malformed ids and unsupported parent types" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "comment_id" => "definitely-not-a-valid-operately-id-%%%",
               "parent_type" => "space_discussion"
             })

    assert {:error, :invalid_arguments} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "comment_id" => "definitely-not-a-valid-operately-id-%%%",
               "parent_type" => "project"
             })
  end
end
