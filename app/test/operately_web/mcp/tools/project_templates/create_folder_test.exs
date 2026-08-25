defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateFolderTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceFolder
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateFolder
  alias OperatelyWeb.Paths

  test "call/2 creates a nested folder in a template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_folder(:folder, :template, position: 0)

    assert {:ok, %{folder: folder}} =
             CreateFolder.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "parent_folder_id" => Paths.project_template_resource_folder_id(ctx.folder),
               "name" => "New folder"
             })

    db_folder =
      folder.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(ResourceFolder, &1))
      |> Operately.Repo.preload(:node)

    assert db_folder.name == "New folder"
    assert db_folder.node.parent_folder_id == ctx.folder.id
  end
end
