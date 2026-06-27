defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.RenameFolder do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ResourceHubs.RenameFolder, as: FolderRename
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "rename_folder",
      title: "Rename Folder",
      description: "Renames one docs and files folder.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 198,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Rename a folder", "arguments" => %{"folder_id" => "folder_123", "name" => "Archived docs"}}],
      input_schema:
        JsonSchema.object(
          %{
            "folder_id" => JsonSchema.string("The folder identifier."),
            "name" => JsonSchema.string("The new folder name.")
          },
          required: ["folder_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the rename succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"folder_id" => folder_id, "name" => name}) do
    with {:ok, folder_id} <- Helpers.decode_id(folder_id),
         {:ok, _result} <- FolderRename.call(conn, %{folder_id: folder_id, new_name: name}) do
      {:ok, %{success: true}}
    end
  end
end
