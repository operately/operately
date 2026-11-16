defmodule OperatelyWeb.Mcp.Tools.Companies.GetActivity do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Companies.GetActivity, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_activity",
      title: "Get Activity",
      description: "Returns an accessible activity and its details, including permissions. Use an activity ID from list_activities.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 99,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "companies"},
      examples: [%{"title" => "Get Activity", "arguments" => %{"activity_id" => "activity_123"}}],
      input_schema: JsonSchema.object(%{"activity_id" => JsonSchema.string("The activity identifier.")}, required: ["activity_id"]),
      output_schema: JsonSchema.object(%{"activity" => JsonSchema.any_object("The activity and its details.")}, required: ["activity"])
    )
  end

  @impl true
  def call(conn, %{"activity_id" => id}) when is_binary(id) do
    with {:ok, id} <- Helpers.decode_id(id) do
      Api.call(conn, %{id: id, include_permissions: true})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
