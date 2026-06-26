defmodule OperatelyWeb.Mcp.Tools.Spaces.CreateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Messages.Message
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.CreateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a space discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "title" => "Space discussion",
               "content" => "Space discussion content"
             })

    discussion = Operately.Repo.get!(Message, ToolConnHelper.decode_id!(discussion.id))

    assert discussion.title == "Space discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.body) == "Space discussion content"
  end
end
