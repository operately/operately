defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Documents.Update, as: DocumentUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_document",
      title: "Update Document",
      description: "Updates the name and body of one document in a live Docs & Files hub. For reusable documents inside a project template, use update_project_template_document.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 191,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [
        %{
          "title" => "Update a document",
          "arguments" => %{
            "document_id" => "document_123",
            "name" => "Updated spec",
            "content" => "# Updated spec"
          }
        },
        %{
          "title" => "Update a document and notify people",
          "arguments" => %{
            "document_id" => "document_123",
            "name" => "Updated spec",
            "content" => "# Updated spec",
            "notify_person_ids" => ["person_123"]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "document_id" => JsonSchema.string("The document identifier."),
            "name" => JsonSchema.string("The document name."),
            "content" => JsonSchema.string("The document body in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this update. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this document. Defaults to false."
              )
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
  def call(conn, %{"document_id" => document_id, "name" => name, "content" => content} = arguments) do
    with {:ok, document_id} <- Helpers.decode_id(document_id),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(content),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      DocumentUpdate.call(
        conn,
        Map.merge(
          %{
            document_id: document_id,
            name: name,
            content: content
          },
          notification_inputs
        )
      )
    end
  end
end
