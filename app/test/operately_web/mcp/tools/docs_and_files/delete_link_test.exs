defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteLinkTest do
  use Operately.DataCase, async: true

  alias Operately.ResourceHubs.Link
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteLink
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a link" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_link(:link, :hub)

    assert {:ok, %{success: true}} =
             DeleteLink.call(ToolConnHelper.conn(ctx), %{
               "link_id" => Paths.link_id(ctx.link)
             })

    refute Operately.Repo.get(Link, ctx.link.id)
  end

  test "returns invalid_arguments for a malformed link id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             DeleteLink.call(ToolConnHelper.conn(ctx), %{
               "link_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
