defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.GetTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.Get
  alias OperatelyWeb.Paths

  test "call/2 returns a project template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_company_member(:other)
      |> Factory.add_project_template_person(:template_person, :template, :other)

    assert {:ok, %{template: template}} =
             Get.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template)
             })

    assert template.id == Paths.project_template_id(ctx.template)
    assert template.name == "Launch template"
    assert Map.has_key?(template, :contributors)
    refute Map.has_key?(template, :people)
    assert Enum.any?(template.contributors, &(&1.id == Paths.project_template_person_id(ctx.template_person)))
  end

  test "call/2 returns an archived template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    archived =
      ctx.template
      |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()})
      |> Operately.Repo.update!()

    arguments = %{"template_id" => Paths.project_template_id(archived)}

    assert {:ok, %{template: template}} = Get.call(ToolConnHelper.conn(ctx), arguments)
    assert template.id == Paths.project_template_id(archived)
  end

  test "call/2 returns not_found when the feature is disabled" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    arguments = %{"template_id" => Paths.project_template_id(ctx.template)}

    ctx = Factory.disable_feature(ctx, "project_templates")

    assert {:error, :not_found} = Get.call(ToolConnHelper.conn(ctx), arguments)
  end
end
