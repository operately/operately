defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.Get, as: DocumentGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_document",
      title: "Get Document",
      description: "Returns one document by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 93,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Open a document by ID", "arguments" => %{"document_id" => "document_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "document_id" => JsonSchema.string("The document identifier.")
          },
          required: ["document_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "document" => JsonSchema.any_object("The matching document.")
          },
          required: ["document"]
        )
    )
  end

  @impl true
  def call(conn, %{"document_id" => document_id}) do
    with {:ok, document_id} <- Helpers.decode_id(document_id),
         {:ok, %{document: document}} <- DocumentGet.call(conn, %{id: document_id}) do
      {:ok, %{document: Map.put(document, :comments, Helpers.load_comments(conn, document_id, :resource_hub_document))}}
    end
  end
end
