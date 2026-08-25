defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetDocumentVersion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.GetVersion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_document_version",
      title: "Get Document Version",
      description: "Gets one saved version of a document.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 98,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Get version", "arguments" => %{"document_id" => "document_123", "version_number" => 2}}],
      input_schema:
        JsonSchema.object(%{"document_id" => JsonSchema.string("The document identifier."), "version_number" => JsonSchema.integer("The version number.", minimum: 1)},
          required: ["document_id", "version_number"]
        ),
      output_schema: JsonSchema.object(%{"version" => JsonSchema.any_object("The document version.")}, required: ["version"])
    )
  end

  @impl true
  def call(conn, %{"document_id" => document_id, "version_number" => version_number}) when is_integer(version_number) and version_number > 0 do
    with {:ok, document_id} <- Helpers.decode_id(document_id), do: GetVersion.call(conn, %{document_id: document_id, version_number: version_number})
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
