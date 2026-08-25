defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateFolderTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceFolder
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateFolder
  alias OperatelyWeb.Paths

  test "call/2 renames a template folder" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_folder(:folder, :template, name: "Plans")

    assert {:ok, %{folder: folder}} =
             UpdateFolder.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "folder_id" => Paths.project_template_resource_folder_id(ctx.folder),
               "name" => "Updated folder"
             })

    db_folder = Operately.Repo.get!(ResourceFolder, ctx.folder.id)

    assert folder.name == "Updated folder"
    assert db_folder.name == "Updated folder"
  end
end
