defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.MoveResourceHubItem do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ResourceHubs.UpdateParentFolder, as: ResourceHubMove
  alias OperatelyWeb.Mcp.Helpers

  @resource_types ["document", "file", "link", "folder"]

  @impl true
  def definition do
    Definition.new!(
      name: "move_resource_hub_item",
      title: "Move Resource Hub Item",
      description: "Moves one document, file, link, or folder to a different folder or to the hub root.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 199,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Move a document into a folder", "arguments" => %{"resource_type" => "document", "resource_id" => "document_123", "folder_id" => "folder_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "resource_type" => JsonSchema.string("The kind of item to move.", enum: @resource_types),
            "resource_id" => JsonSchema.string("The identifier of the document, file, link, or folder."),
            "folder_id" => JsonSchema.string("The destination folder identifier. Omit it to move the item to the hub root.")
          },
          required: ["resource_type", "resource_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the move succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, resource_id} <- Helpers.decode_id(arguments["resource_id"]),
         {:ok, folder_id} <- Helpers.decode_optional_id(arguments["folder_id"]),
         {:ok, _result} <-
           ResourceHubMove.call(conn, %{
             resource_id: resource_id,
             resource_type: arguments["resource_type"],
             new_folder_id: folder_id
           }) do
      {:ok, %{success: true}}
    end
  end
end
