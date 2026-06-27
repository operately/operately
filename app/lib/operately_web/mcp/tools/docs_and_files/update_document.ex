defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.Update, as: DocumentUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_document",
      title: "Update Document",
      description: "Updates the name and body of one document.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 191,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Update a document", "arguments" => %{"document_id" => "document_123", "name" => "Updated spec", "content" => "# Updated spec"}}],
      input_schema:
        JsonSchema.object(
          %{
            "document_id" => JsonSchema.string("The document identifier."),
            "name" => JsonSchema.string("The document name."),
            "content" => JsonSchema.string("The document body in plain text or markdown.")
          },
          required: ["document_id", "name", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{"document" => JsonSchema.any_object("The updated document.")},
          required: ["document"]
        )
    )
  end

  @impl true
  def call(conn, %{"document_id" => document_id, "name" => name, "content" => content}) do
    with {:ok, document_id} <- Helpers.decode_id(document_id),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(content) do
      DocumentUpdate.call(conn, %{document_id: document_id, name: name, content: content, subscriber_ids: []})
    end
  end
end
