defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteResourceTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceLink
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteResource
  alias OperatelyWeb.Paths

  test "call/2 deletes a template resource node" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_folder(:folder, :template, position: 0)
      |> Factory.add_project_template_resource_link(:link, :template, parent_folder: :folder, position: 2)

    assert {:ok, %{success: true}} =
             DeleteResource.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "node_id" => Paths.project_template_resource_node_id(ctx.link.node)
             })

    refute Operately.Repo.get(ResourceLink, ctx.link.id)
  end
end
