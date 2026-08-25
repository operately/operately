defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateLinkTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.ResourceLink
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateLink
  alias OperatelyWeb.Paths

  test "call/2 updates a template link and clears description" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_resource_link(:link, :template, name: "Original", url: "https://example.com", description: %{"type" => "doc", "content" => []})

    assert {:ok, %{link: link}} =
             UpdateLink.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "link_id" => Paths.project_template_resource_link_id(ctx.link),
               "name" => "Updated link",
               "url" => "https://example.com/updated",
               "description" => nil,
               "type" => "other"
             })

    db_link = Operately.Repo.get!(ResourceLink, ctx.link.id)

    assert link.name == "Updated link"
    assert db_link.name == "Updated link"
    assert db_link.url == "https://example.com/updated"
    assert db_link.description == nil
  end
end
