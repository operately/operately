defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DuplicateTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.Duplicate
  alias OperatelyWeb.Paths

  test "call/2 duplicates a template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    assert {:ok, %{template: template}} =
             Duplicate.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "name" => "Template copy"
             })

    db_template =
      template.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(ProjectTemplate, &1))

    assert db_template.name == "Template copy"
    assert db_template.id != ctx.template.id
  end
end
