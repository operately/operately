defmodule OperatelyWeb.Mcp.Tools.Notifications.Unsubscribe do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Notifications.Unsubscribe, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "unsubscribe",
      title: "Unsubscribe",
      description: "Cancels your subscription; never changes another member subscription.",
      company_mode: :authenticated,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "notifications"},
      examples: [%{"title" => "Unsubscribe", "arguments" => %{"subscription_list_id" => "subscription_list_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "subscription_list_id" => JsonSchema.string("Subscription list id.")
          },
          required: ["subscription_list_id"]
        ),
      output_schema: JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, subscription_list_id} <- Helpers.decode_id(arguments["subscription_list_id"]) do
      {:ok, %{subscription_list_id: subscription_list_id}}
    end
  end
end
