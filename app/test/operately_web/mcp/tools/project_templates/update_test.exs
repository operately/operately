defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.Update
  alias OperatelyWeb.Paths

  test "call/2 updates template metadata" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    assert {:ok, %{success: true}} =
             Update.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "name" => "Updated template",
               "description" => nil,
               "duration_days" => 45
             })

    template = Operately.Repo.reload!(ctx.template)

    assert template.name == "Updated template"
    assert template.description == nil
    assert template.duration_days == 45
  end
end
