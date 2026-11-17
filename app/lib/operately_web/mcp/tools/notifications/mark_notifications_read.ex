defmodule OperatelyWeb.Mcp.Tools.Notifications.MarkNotificationsRead do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Notifications.MarkManyAsRead, as: Api
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "mark_notifications_read",
      title: "Mark Notifications Read",
      description: "Marks selected notifications as read. All supplied notifications must belong to you.",
      company_mode: :authenticated,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "notifications"},
      examples: [%{"title" => "Mark notifications read", "arguments" => %{"ids" => ["notification_123"]}}],
      input_schema:
        JsonSchema.object(
          %{
            "ids" => JsonSchema.array(JsonSchema.string("Notification IDs from list_notifications. One or more IDs."))
          },
          required: ["ids"]
        ),
      output_schema: JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, ids} <- Inputs.ids(arguments["ids"]) do
      {:ok, %{ids: ids}}
    end
  end
end
