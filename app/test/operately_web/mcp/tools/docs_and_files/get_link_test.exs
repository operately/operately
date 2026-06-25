defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetLinkTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.GetLink
  alias OperatelyWeb.Paths

  test "call/2 returns one link with comments" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_link(:link, :hub)
      |> Factory.preload(:link, :resource_hub)
      |> Factory.add_comment(:link_comment, :link)

    conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator)

    assert {:ok, %{link: link}} = GetLink.call(conn, %{"link_id" => Paths.link_id(ctx.link)})
    assert link.id == Paths.link_id(ctx.link)
    assert length(link.comments) == 1
  end
end
