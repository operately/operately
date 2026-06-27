defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.PublishDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.Publish, as: DocumentPublish
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "publish_document",
      title: "Publish Document",
      description: "Publishes one draft document, optionally with a final name or body.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 192,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Publish a draft document", "arguments" => %{"document_id" => "document_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "document_id" => JsonSchema.string("The document identifier."),
            "name" => JsonSchema.string("An optional final document name."),
            "content" => JsonSchema.string("An optional final plain text or markdown body.")
          },
          required: ["document_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"document" => JsonSchema.any_object("The published document.")},
          required: ["document"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, document_id} <- Helpers.decode_id(arguments["document_id"]),
         {:ok, content} <- decode_optional_content(arguments["content"]) do
      inputs =
        %{document_id: document_id}
        |> Helpers.put_optional(:name, arguments["name"])
        |> Helpers.put_optional(:content, content)

      DocumentPublish.call(conn, inputs)
    end
  end

  defp decode_optional_content(nil), do: {:ok, nil}
  defp decode_optional_content(content), do: Helpers.markdown_to_rich_text_allow_blank(content)
end
