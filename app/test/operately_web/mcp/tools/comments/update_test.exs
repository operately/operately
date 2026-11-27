defmodule OperatelyWeb.Mcp.Tools.Comments.UpdateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Comments.Update
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a space discussion comment" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)
      |> Factory.preload(:discussion, :space)
      |> Factory.add_comment(:comment, :discussion)

    assert {:ok, %{comment: comment}} =
             Update.call(ToolConnHelper.conn(ctx), %{
               "comment_id" => Paths.comment_id(ctx.comment),
               "parent_type" => "space_discussion",
               "content" => "Updated MCP comment"
             })

    assert comment.id == Paths.comment_id(ctx.comment)
    assert ToolConnHelper.reload(ctx.comment) |> Map.get(:content) |> ToolConnHelper.rich_text_to_string() == "Updated MCP comment"
  end

  test "older clients can edit a reply on a project activity using its comment ID" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space) |> Factory.pause_project(:project)
    pause = Repo.get_by!(Operately.Activities.Activity, action: "project_pausing", author_id: ctx.creator.id) |> Repo.preload(:comment_thread)
    ctx = ctx |> Map.put(:thread, pause.comment_thread) |> Factory.add_comment(:reply, :thread)

    assert {:ok, _} = Update.call(ToolConnHelper.conn(ctx), %{"comment_id" => Paths.comment_id(ctx.reply), "parent_type" => "project_discussion", "content" => "Edited reply"})
    assert ToolConnHelper.rich_text_to_string(Repo.reload!(ctx.reply).content) == "Edited reply"
  end

  test "returns invalid_arguments for malformed ids and unsupported parent types" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             Update.call(ToolConnHelper.conn(ctx), %{
               "comment_id" => "definitely-not-a-valid-operately-id-%%%",
               "parent_type" => "space_discussion",
               "content" => "Updated MCP comment"
             })

    assert {:error, :invalid_arguments} =
             Update.call(ToolConnHelper.conn(ctx), %{
               "comment_id" => "definitely-not-a-valid-operately-id-%%%",
               "parent_type" => "project",
               "content" => "Updated MCP comment"
             })
  end
end
