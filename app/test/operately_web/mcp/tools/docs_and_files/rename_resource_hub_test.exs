defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.RenameResourceHubTest do
  use Operately.DataCase, async: true
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.RenameResourceHub, as: Tool
  alias OperatelyWeb.Paths

  test "decodes public IDs and delegates the lifecycle action" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space)

    arguments = %{"resource_hub_id" => Paths.resource_hub_id(ctx.hub.id), "new_name" => "Design"}
    assert {:ok, %{success: true}} = Tool.call(ToolConnHelper.conn(ctx), arguments)

    other = Factory.setup(%{})
    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), arguments)
  end
end
