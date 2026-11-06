defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.RenameResourceHub do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.ResourceHubs.Rename, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "rename_resource_hub",
      title: "Rename Resource Hub",
      description: "Rename a space-owned Resource Hub. Requires space edit access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 202,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Rename a Resource Hub", "arguments" => %{"resource_hub_id" => "hub_123", "new_name" => "Design"}}],
      input_schema:
        JsonSchema.object(
          %{
            "resource_hub_id" => JsonSchema.string("Resource Hub identifier."),
            "new_name" => JsonSchema.string("New name of the Resource Hub.")
          },
          required: ["resource_hub_id", "new_name"]
        ),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("Whether the operation succeeded.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, resource_hub_id} <- Helpers.decode_id(arguments["resource_hub_id"]) do
      Endpoint.call(conn, %{resource_hub_id: resource_hub_id, new_name: arguments["new_name"]})
    end
  end
end
