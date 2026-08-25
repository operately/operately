defmodule OperatelyWeb.Mcp.Tools.Projects.RemoveContributorTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.Contributor
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.RemoveContributor
  alias OperatelyWeb.Paths

  test "call/2 removes a project contributor" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_contributor(:contributor, :project)

    contributor_id = ctx.contributor.id

    assert {:ok, %{contributor: contributor}} =
             RemoveContributor.call(ToolConnHelper.conn(ctx), %{
               "contributor_id" => Paths.project_contributor_id(ctx.contributor)
             })

    assert contributor.id == Paths.project_contributor_id(ctx.contributor)
    refute Operately.Repo.get(Contributor, contributor_id)
  end
end
