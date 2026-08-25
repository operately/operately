defmodule OperatelyWeb.Mcp.Tools.Projects.AddContributorTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.Contributor
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.AddContributor
  alias OperatelyWeb.Paths

  test "call/2 adds a contributor to a project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:new_person)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project_contributor: project_contributor}} =
             AddContributor.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "person_id" => Paths.person_id(ctx.new_person),
               "responsibility" => "Engineering",
               "access_level" => "edit_access",
               "role" => "contributor"
             })

    contributor =
      project_contributor.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Contributor, &1))

    assert contributor.project_id == ctx.project.id
    assert contributor.person_id == ctx.new_person.id
    assert contributor.responsibility == "Engineering"
    assert contributor.role == :contributor
  end
end
