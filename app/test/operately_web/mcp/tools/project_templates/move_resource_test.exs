defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.MoveResourceTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceNode
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.MoveResource
  alias OperatelyWeb.Paths

  test "call/2 moves a resource into another folder" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_folder(:folder, :template, position: 0)
      |> Factory.add_project_template_resource_folder(:target_folder, :template, position: 1)
      |> Factory.add_project_template_resource_document(:document, :template, parent_folder: :folder, position: 0)

    assert {:ok, %{success: true}} =
             MoveResource.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "node_id" => Paths.project_template_resource_node_id(ctx.document.node),
               "parent_folder_id" => Paths.project_template_resource_folder_id(ctx.target_folder)
             })

    node = Operately.Repo.get!(ResourceNode, ctx.document.node.id)

    assert node.parent_folder_id == ctx.target_folder.id
    assert node.position == 0
  end
end
