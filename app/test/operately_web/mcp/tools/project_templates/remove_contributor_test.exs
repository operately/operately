defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.RemoveContributorTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Person
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.RemoveContributor
  alias OperatelyWeb.Paths

  test "call/2 removes a contributor from a template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_company_member(:other)
      |> Factory.add_project_template_person(:template_person, :template, :other)

    assert {:ok, %{success: true}} =
             RemoveContributor.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "contributor_id" => Paths.project_template_person_id(ctx.template_person)
             })

    refute Operately.Repo.get(Person, ctx.template_person.id)
  end
end
