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
      examples: [
        %{
          "title" => "Publish a draft document",
          "arguments" => %{"document_id" => "document_123"}
        },
        %{
          "title" => "Publish a document and notify everyone",
          "arguments" => %{"document_id" => "document_123", "notify_everyone" => true}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "document_id" => JsonSchema.string("The document identifier."),
            "name" => JsonSchema.string("An optional final document name."),
            "content" => JsonSchema.string("An optional final plain text or markdown body."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this publish. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this document. Defaults to false."
              )
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
         {:ok, content} <- decode_optional_content(arguments["content"]),
         {:ok, notification_inputs} <- decode_optional_notification_inputs(arguments) do
      inputs =
        %{document_id: document_id}
        |> Helpers.put_optional(:name, arguments["name"])
        |> Helpers.put_optional(:content, content)
        |> Map.merge(notification_inputs)

      DocumentPublish.call(conn, inputs)
    end
  end

  # Only pass notification fields when the client sets them, so omitting them
  # does not wipe existing document subscriptions on publish.
  defp decode_optional_notification_inputs(arguments) do
    if Map.has_key?(arguments, "notify_person_ids") or Map.has_key?(arguments, "notify_everyone") do
      Helpers.decode_notification_inputs(arguments)
    else
      {:ok, %{}}
    end
  end

  defp decode_optional_content(nil), do: {:ok, nil}
  defp decode_optional_content(content), do: Helpers.markdown_to_rich_text_allow_blank(content)
end
