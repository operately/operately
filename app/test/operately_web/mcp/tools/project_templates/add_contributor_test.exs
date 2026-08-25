defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.AddContributorTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Person
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.AddContributor
  alias OperatelyWeb.Paths

  test "call/2 adds a contributor to a template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_company_member(:other)

    assert {:ok, %{contributor: contributor}} =
             AddContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "person_id" => Paths.person_id(ctx.other),
               "role" => "champion",
               "responsibility" => "Lead",
               "access_level" => "full_access"
             })

    db_person =
      contributor.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Person, &1))

    assert db_person.role == :champion
    assert db_person.responsibility == "Lead"
    assert db_person.person_id == ctx.other.id
  end
end
