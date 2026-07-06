defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.Delete, as: DocumentDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_document",
      title: "Delete Document",
      description: "Permanently deletes one document from a resource hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 223,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Delete a document", "arguments" => %{"document_id" => "document_123"}}],
      input_schema:
        JsonSchema.object(
          %{"document_id" => JsonSchema.string("The document identifier.")},
          required: ["document_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"document" => JsonSchema.any_object("The deleted document.")},
          required: ["document"]
        )
    )
  end

  @impl true
  def call(conn, %{"document_id" => document_id}) do
    with {:ok, document_id} <- Helpers.decode_id(document_id) do
      DocumentDelete.call(conn, %{document_id: document_id})
    end
  end
end
