defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.ArchiveTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.Archive
  alias OperatelyWeb.Paths

  test "call/2 archives an active template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    assert {:ok, %{success: true}} =
             Archive.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template)
             })

    assert Operately.Repo.reload!(ctx.template).archived_at
  end
end
