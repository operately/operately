defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.RestoreTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.Restore
  alias OperatelyWeb.Paths

  test "call/2 restores an archived template" do
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
             Restore.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(archived)
             })

    assert Operately.Repo.reload!(archived).archived_at == nil
  end
end
