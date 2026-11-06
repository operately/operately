defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteResourceHub do
  use OperatelyWeb.Mcp.Tool
  alias OperatelyWeb.Api.ResourceHubs.Delete, as: Endpoint
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_resource_hub",
      title: "Delete Resource Hub",
      description:
        "Delete an empty space-owned Resource Hub. Remove all documents, drafts, files, links, and folders first. The default Resource Hub cannot be deleted. Requires space edit access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 204,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Delete an empty Resource Hub", "arguments" => %{"resource_hub_id" => "hub_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "resource_hub_id" => JsonSchema.string("Resource Hub identifier.")
          },
          required: ["resource_hub_id"]
        ),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("True when the Resource Hub is deleted.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, resource_hub_id} <- Helpers.decode_id(arguments["resource_hub_id"]) do
      Endpoint.call(conn, %{resource_hub_id: resource_hub_id})
    end
  end
end
