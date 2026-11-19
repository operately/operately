defmodule OperatelyWeb.Mcp.Tools.Notifications.ListNotifications do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Notifications.List, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "list_notifications",
      title: "List Notifications",
      description: "Lists your notifications with read state, newest first. Page defaults to 1; per_page defaults to 100.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 94,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "notifications"},
      examples: [%{"title" => "List notifications", "arguments" => %{}}],
      input_schema:
        JsonSchema.object(
          %{
            "page" => JsonSchema.integer("Page.", minimum: 1),
            "per_page" => JsonSchema.integer("Per page.", minimum: 1)
          },
          required: []
        ),
      output_schema: JsonSchema.object(%{"notifications" => JsonSchema.array(JsonSchema.any_object())}, required: ["notifications"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, inputs} <- Helpers.put_present(%{}, arguments, "page", :page, &Inputs.positive(&1)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "per_page", :per_page, &Inputs.positive(&1)) do
      {:ok, inputs}
    end
  end
end
