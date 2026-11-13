defmodule OperatelyWeb.Mcp.Tools.Notifications.UnsubscribeTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Notifications.Unsubscribe, as: Tool
  alias Operately.Support.RichText

  test "adapts the document subscription workflow" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_resource_hub(:hub, :space, :creator) |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
    conn = ToolConnHelper.conn(ctx)
    assert {:ok, _} = OperatelyWeb.Api.Notifications.Subscribe.call(conn, %{subscription_list_id: ctx.document.subscription_list_id, type: :resource_hub_document})
    assert {:ok, _} = Tool.call(conn, %{"subscription_list_id" => Operately.ShortUuid.encode!(ctx.document.subscription_list_id)})

    assert {:ok, %{subscribed: false}} =
             OperatelyWeb.Api.Notifications.IsSubscribed.call(conn, %{resource_id: ctx.document.id, resource_type: :resource_hub_document})
  end
end
