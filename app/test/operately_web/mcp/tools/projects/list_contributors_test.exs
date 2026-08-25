defmodule OperatelyWeb.Mcp.Tools.Projects.ListContributorsTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.ListContributors
  alias OperatelyWeb.Paths

  test "call/2 returns project contributors" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:contributor, :project)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{contributors: contributors}} =
             ListContributors.call(conn, %{"project_id" => Paths.project_id(ctx.project)})

    assert Enum.any?(contributors, &(&1.id == Paths.project_contributor_id(ctx.contributor)))
  end
end
