defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.ListDocumentVersions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.ListVersions
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_document_versions",
      title: "List Document Versions",
      description: "Lists the saved version history of a document.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 97,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "List versions", "arguments" => %{"document_id" => "document_123"}}],
      input_schema: JsonSchema.object(%{"document_id" => JsonSchema.string("The document identifier.")}, required: ["document_id"]),
      output_schema: JsonSchema.object(%{"versions" => JsonSchema.array(JsonSchema.any_object())}, required: ["versions"])
    )
  end

  @impl true
  def call(conn, %{"document_id" => document_id}) do
    with {:ok, document_id} <- Helpers.decode_id(document_id), do: ListVersions.call(conn, %{document_id: document_id})
  end
end
