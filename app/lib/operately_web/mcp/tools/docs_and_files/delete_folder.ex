defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteFolder do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ResourceHubs.DeleteFolder, as: FolderDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_folder",
      title: "Delete Folder",
      description: "Permanently deletes one folder from a resource hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 226,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Delete a folder", "arguments" => %{"folder_id" => "folder_123"}}],
      input_schema:
        JsonSchema.object(
          %{"folder_id" => JsonSchema.string("The folder identifier.")},
          required: ["folder_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the folder is deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"folder_id" => folder_id}) do
    with {:ok, folder_id} <- Helpers.decode_id(folder_id),
         {:ok, %{success: true}} <- FolderDelete.call(conn, %{folder_id: folder_id}) do
      {:ok, %{success: true}}
    end
  end
end
