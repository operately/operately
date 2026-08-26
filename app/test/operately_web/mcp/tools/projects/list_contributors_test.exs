defmodule OperatelyWeb.Mcp.Tools.Projects.ListContributorsTest do
  use Operately.DataCase, async: true

  alias Operately.Access.Binding
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.ListContributors
  alias OperatelyWeb.Paths

  test "call/2 returns project contributors with role, responsibility, and access" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:contributor, :project,
        role: :contributor,
        responsibility: "Engineering",
        permissions: :edit_access
      )

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{contributors: contributors}} =
             ListContributors.call(conn, %{"project_id" => Paths.project_id(ctx.project)})

    contributor = Enum.find(contributors, &(&1.id == Paths.project_contributor_id(ctx.contributor)))

    assert contributor
    assert contributor.role == "contributor"
    assert contributor.responsibility == "Engineering"
    assert contributor.access_level == Binding.edit_access()
  end
end
