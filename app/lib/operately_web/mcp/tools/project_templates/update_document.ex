defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateDocument, as: DocumentUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_document",
      title: "Update Project Template Document",
      description: "Replaces a project-template document's name and Markdown content. For live hub documents, use update_document.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 257,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Document",
          "arguments" => %{
            "template_id" => "project_template_123",
            "document_id" => "template_document_123",
            "name" => "Updated plan",
            "content" => "# Updated plan"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "document_id" => JsonSchema.string("The template document identifier."),
            "name" => JsonSchema.string("The replacement name."),
            "content" => JsonSchema.string("The replacement content in Markdown.")
          },
          required: ["template_id", "document_id", "name", "content"]
        ),
      output_schema: JsonSchema.object(%{"document" => JsonSchema.any_object()}, required: ["document"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, document_id} <- Helpers.decode_id(arguments["document_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(arguments["content"]) do
      DocumentUpdate.call(conn, %{template_id: template_id, document_id: document_id, name: arguments["name"], content: content})
    end
  end
end
