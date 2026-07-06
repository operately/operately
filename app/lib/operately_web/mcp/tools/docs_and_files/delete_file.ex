defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteFile do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Files.Delete, as: FileDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_file",
      title: "Delete File",
      description: "Permanently deletes one file from a resource hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 224,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Delete a file", "arguments" => %{"file_id" => "file_123"}}],
      input_schema:
        JsonSchema.object(
          %{"file_id" => JsonSchema.string("The file identifier.")},
          required: ["file_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"file" => JsonSchema.any_object("The deleted file.")},
          required: ["file"]
        )
    )
  end

  @impl true
  def call(conn, %{"file_id" => file_id}) do
    with {:ok, file_id} <- Helpers.decode_id(file_id) do
      FileDelete.call(conn, %{file_id: file_id})
    end
  end
end
