defmodule OperatelyWeb.Mcp.Tools.Notifications.Unsubscribe do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.Notifications.Unsubscribe, as: Api
  alias OperatelyWeb.Api.Wrappers.Notifications.ResourceSubscription
  alias OperatelyWeb.Mcp.Helpers

  @resource_types Enum.map(ResourceSubscription.resource_types(), &Atom.to_string/1)

  @impl true
  def definition do
    Definition.new!(
      name: "unsubscribe",
      title: "Unsubscribe",
      description: "Cancels your subscription to an accessible resource. Use the resource's own ID and type.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "notifications"},
      examples: [%{"title" => "Unsubscribe from a project", "arguments" => %{"resource_id" => "project_123", "resource_type" => "project"}}],
      input_schema:
        JsonSchema.object(
          %{
            "resource_id" => JsonSchema.string("The resource identifier."),
            "resource_type" => JsonSchema.string("Resource type. Use goal_update for goal check-ins, message for space discussions, and comment_thread for project discussions.", enum: @resource_types)
          },
          required: ["resource_id", "resource_type"]
        ),
      output_schema: JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, %{"resource_id" => id, "resource_type" => type}) when is_binary(id) do
    with {:ok, resource_id} <- Helpers.decode_id(id),
         {:ok, resource_type} <- Helpers.decode_enum(type, @resource_types) do
      Api.call(conn, %{resource_id: resource_id, resource_type: resource_type})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
