defmodule OperatelyWeb.Mcp.Tools.Notifications.MarkAllNotificationsRead do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Notifications.MarkAllAsRead, as: Api

  @impl true
  def definition do
    Definition.new!(
      name: "mark_all_notifications_read",
      title: "Mark All Notifications Read",
      description: "Marks all of your notifications as read in the connected company.",
      company_mode: :authenticated,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "notifications"},
      examples: [%{"title" => "Mark all notifications read", "arguments" => %{}}],
      input_schema:
        JsonSchema.object(%{},
          required: []
        ),
      output_schema: JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, _arguments) do
    Api.call(conn, %{})
  end
end
