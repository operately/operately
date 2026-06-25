defmodule OperatelyWeb.Mcp.Tools.Projects.ListDiscussionsTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.ListDiscussions
  alias OperatelyWeb.Paths

  test "call/2 returns discussions for one project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_discussion(:discussion, :project)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{discussions: discussions}} = ListDiscussions.call(conn, %{"project_id" => Paths.project_id(ctx.project)})
    assert Enum.map(discussions, & &1.id) == [Paths.comment_thread_id(ctx.discussion)]
  end
end
