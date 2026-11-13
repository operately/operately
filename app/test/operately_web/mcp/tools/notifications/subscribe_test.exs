defmodule OperatelyWeb.Mcp.Tools.Notifications.SubscribeTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Notifications.Subscribe, as: Tool
  alias Operately.Support.RichText

  test "adapts the document subscription workflow" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_resource_hub(:hub, :space, :creator) |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    conn = ToolConnHelper.conn(ctx)

    assert {:ok, _} = Tool.call(conn, %{"subscription_list_id" => Operately.ShortUuid.encode!(ctx.document.subscription_list_id), "type" => "resource_hub_document"})

    assert {:ok, %{subscribed: true}} =
             OperatelyWeb.Api.Notifications.IsSubscribed.call(conn, %{resource_id: ctx.document.id, resource_type: :resource_hub_document})
  end
end
