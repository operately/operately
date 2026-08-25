defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.RestoreDocumentVersion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.RestoreVersion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "restore_document_version",
      title: "Restore Document Version",
      description: "Restores a saved document version while preserving version history.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 193,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Restore version", "arguments" => %{"document_id" => "document_123", "version_number" => 2, "expected_current_version" => 4}}],
      input_schema:
        JsonSchema.object(
          %{
            "document_id" => JsonSchema.string("The document identifier."),
            "version_number" => JsonSchema.integer("The version to restore.", minimum: 1),
            "expected_current_version" => JsonSchema.integer("The current version expected by the caller.", minimum: 1)
          },
          required: ["document_id", "version_number", "expected_current_version"]
        ),
      output_schema:
        JsonSchema.object(
          %{"document" => JsonSchema.any_object("The restored document."), "restored_version" => JsonSchema.nullable(JsonSchema.any_object("The restored version."))},
          required: ["document"]
        )
    )
  end

  @impl true
  def call(conn, %{"document_id" => document_id, "version_number" => version_number, "expected_current_version" => expected_current_version})
      when is_integer(version_number) and version_number > 0 and is_integer(expected_current_version) and expected_current_version > 0 do
    with {:ok, document_id} <- Helpers.decode_id(document_id) do
      RestoreVersion.call(conn, %{document_id: document_id, version_number: version_number, expected_current_version: expected_current_version})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
