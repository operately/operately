defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.Delete
  alias OperatelyWeb.Paths

  test "call/2 deletes an archived template" do
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

    assert {:ok, %{success: true}} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(archived)
             })

    refute Operately.Repo.get(ProjectTemplate, archived.id)
  end
end
