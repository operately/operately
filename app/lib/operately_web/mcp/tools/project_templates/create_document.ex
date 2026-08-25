defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateDocument
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_document",
      title: "Create Project Template Document",
      description: "Creates a Markdown document in a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 256,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template Document",
          "arguments" => %{"template_id" => "project_template_123", "name" => "Launch plan", "content" => "# Launch plan"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "parent_folder_id" => JsonSchema.nullable(JsonSchema.string("Optional parent folder identifier.")),
            "name" => JsonSchema.string("The document name."),
            "content" => JsonSchema.string("The document content in Markdown.")
          },
          required: ["template_id", "name", "content"]
        ),
      output_schema: JsonSchema.object(%{"document" => JsonSchema.any_object()}, required: ["document"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, parent_folder_id} <- Helpers.decode_optional_id(arguments["parent_folder_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(arguments["content"]) do
      CreateDocument.call(conn, %{template_id: template_id, parent_folder_id: parent_folder_id, name: arguments["name"], content: content})
    end
  end
end
