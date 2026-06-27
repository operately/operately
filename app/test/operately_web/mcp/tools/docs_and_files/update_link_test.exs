defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateLinkTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Link
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateLink
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a link" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_link(:link, :hub)

    assert {:ok, %{link: link}} =
             UpdateLink.call(ToolConnHelper.conn(ctx), %{
               "link_id" => Paths.link_id(ctx.link),
               "name" => "Updated MCP Link",
               "url" => "https://example.com/updated",
               "type" => "other",
               "description" => "Updated link description"
             })

    link = Operately.Repo.get!(Link, ToolConnHelper.decode_id!(link.id))

    assert link.url == "https://example.com/updated"
    assert ToolConnHelper.rich_text_to_string(link.description) == "Updated link description"
  end
end
