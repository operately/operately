defmodule OperatelyWeb.Mcp.Tools.Projects.CreateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Comments.CommentThread
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.CreateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a project discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "title" => "Project discussion",
               "content" => "Project discussion content"
             })

    discussion = Operately.Repo.get!(CommentThread, ToolConnHelper.decode_id!(discussion.id))

    assert discussion.title == "Project discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.message) == "Project discussion content"
  end
end
