defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateContributorTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateContributor
  alias OperatelyWeb.Paths

  test "call/2 updates a project contributor" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:contributor, :project)

    assert {:ok, %{contributor: contributor}} =
             UpdateContributor.call(ToolConnHelper.conn(ctx), %{
               "contributor_id" => Paths.project_contributor_id(ctx.contributor),
               "responsibility" => "Updated responsibility",
               "access_level" => "comment_access",
               "role" => "reviewer"
             })

    assert contributor.id == Paths.project_contributor_id(ctx.contributor)
    assert contributor.responsibility == "Updated responsibility"
    assert contributor.role == "reviewer"

    reloaded = ToolConnHelper.reload(ctx.contributor)
    assert reloaded.responsibility == "Updated responsibility"
    assert reloaded.role == :reviewer
  end
end
