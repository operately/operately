defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocumentPublicSharing do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.UpdatePublicSharing, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_document_public_sharing",
      title: "Update Document Public Sharing",
      description:
        "Enables or disables public-link access to a published document. Requires document edit access. Enabling sharing lets anyone with the returned URL read it; drafts must be published first.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 215,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Update Document Public Sharing", "arguments" => %{"document_id" => "document_123", "enabled" => true}}],
      input_schema:
        JsonSchema.object(%{"document_id" => JsonSchema.string("The document identifier."), "enabled" => JsonSchema.boolean("Enable public sharing when true; revoke it when false.")},
          required: ["document_id", "enabled"]
        ),
      output_schema: JsonSchema.object(%{"public_url" => JsonSchema.nullable(JsonSchema.string("Public document URL, or null when sharing is disabled."))}, required: ["public_url"])
    )
  end

  @impl true
  def call(conn, %{"document_id" => id, "enabled" => enabled}) when is_binary(id) and is_boolean(enabled) do
    with {:ok, id} <- Helpers.decode_id(id), do: Api.call(conn, %{document_id: id, enabled: enabled})
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
