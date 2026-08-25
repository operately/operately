defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateLinkTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceLink
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateLink
  alias OperatelyWeb.Paths

  test "call/2 creates a link in a template folder" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_folder(:folder, :template, position: 0)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "parent_folder_id" => Paths.project_template_resource_folder_id(ctx.folder),
               "name" => "New link",
               "url" => "https://example.com",
               "type" => "other"
             })

    db_link =
      link.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(ResourceLink, &1))
      |> Operately.Repo.preload(:node)

    assert db_link.name == "New link"
    assert db_link.url == "https://example.com"
    assert db_link.node.parent_folder_id == ctx.folder.id
  end
end
