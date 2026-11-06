defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateResourceHub do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.ResourceHubs.Create, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_resource_hub",
      title: "Create Resource Hub",
      description: "Create a space-owned Resource Hub at the end of the list. Preserves the space's default Resource Hub. Requires space edit access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 201,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Create a Resource Hub", "arguments" => %{"space_id" => "space_123", "name" => "Design"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("Space identifier."),
            "name" => JsonSchema.string("Name of the Resource Hub.")
          },
          required: ["space_id", "name"]
        ),
      output_schema: JsonSchema.object(%{"hub" => JsonSchema.any_object()}, required: ["hub"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]) do
      Endpoint.call(conn, %{space_id: space_id, name: arguments["name"]})
    end
  end
end
