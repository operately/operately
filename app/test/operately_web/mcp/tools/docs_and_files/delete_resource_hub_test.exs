defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteResourceHubTest do
  use Operately.DataCase, async: true
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteResourceHub, as: Tool
  alias OperatelyWeb.Paths

  test "decodes public IDs and delegates the lifecycle action" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:default_hub, :space) |> Factory.add_resource_hub(:hub, :space, :creator)
    arguments = %{"resource_hub_id" => Paths.resource_hub_id(ctx.hub.id)}

    assert {:error, :bad_request, _, %{code: "default_resource_hub_deletion_forbidden"}} =
      Tool.call(ToolConnHelper.conn(ctx), %{"resource_hub_id" => Paths.resource_hub_id(ctx.default_hub.id)})

    other = Factory.setup(%{})

    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), arguments)
    assert {:ok, %{success: true}} = Tool.call(ToolConnHelper.conn(ctx), arguments)
    refute Repo.get(Operately.ResourceHubs.ResourceHub, ctx.hub.id)
  end
end
