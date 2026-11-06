defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateResourceHubTest do
  use Operately.DataCase, async: true
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateResourceHub, as: Tool
  alias OperatelyWeb.Paths

  test "decodes public IDs and delegates the lifecycle action" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space)

    arguments = %{"space_id" => Paths.space_id(ctx.space), "name" => "Design"}
    assert {:ok, %{hub: %{name: "Design"}}} = Tool.call(ToolConnHelper.conn(ctx), arguments)

    other = Factory.setup(%{})
    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), arguments)
  end
end
