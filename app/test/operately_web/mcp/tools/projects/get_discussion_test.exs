defmodule OperatelyWeb.Mcp.Tools.Projects.GetDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.GetDiscussion
  alias OperatelyWeb.Paths

  test "call/2 returns one discussion with comments" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_discussion(:discussion, :project)
      |> Factory.add_comment(:discussion_comment, :discussion)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{discussion: discussion}} = GetDiscussion.call(conn, %{"discussion_id" => Paths.comment_thread_id(ctx.discussion)})
    assert discussion.id == Paths.comment_thread_id(ctx.discussion)
    assert length(discussion.comments) == 1
  end
end
