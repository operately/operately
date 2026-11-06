defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.ListHubsTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.ListHubs
  alias OperatelyWeb.Paths

  test "decodes space IDs and returns default designation" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space)
    assert {:ok, %{hubs: [%{id: id, is_default: true}]}} = ListHubs.call(ToolConnHelper.conn(ctx), %{"space_id" => Paths.space_id(ctx.space)})
    assert id == Paths.resource_hub_id(ctx.hub.id)
    assert {:error, :invalid_arguments} = ListHubs.call(ToolConnHelper.conn(ctx), %{"space_id" => "@invalid!"})
  end
end
