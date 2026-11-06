defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.ListHubs do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ResourceHubs.List, as: ListHubs
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_resource_hubs",
      title: "List Resource Hubs",
      description: "Lists accessible resource hubs in a space with IDs, names, and the default designation. Use a returned ID as resource_hub_id to select a hub explicitly.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 91,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Find a space's resource hubs", "arguments" => %{"space_id" => "space_123"}}],
      input_schema: JsonSchema.object(%{"space_id" => JsonSchema.string("The space identifier.")}, required: ["space_id"]),
      output_schema: JsonSchema.object(%{"hubs" => JsonSchema.array(JsonSchema.any_object())}, required: ["hubs"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]) do
      ListHubs.call(conn, %{space_id: space_id})
    end
  end
end
