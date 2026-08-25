defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateFile do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateFile, as: FileUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_file",
      title: "Update Project Template File",
      description: "Updates the name and optional Markdown description of a file already stored in a template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 258,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template File",
          "arguments" => %{"template_id" => "project_template_123", "file_id" => "template_file_123", "name" => "Launch brief.pdf"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "file_id" => JsonSchema.string("The template file identifier."),
            "name" => JsonSchema.string("The replacement name."),
            "description" => JsonSchema.nullable(JsonSchema.string("Markdown description; null clears it."))
          },
          required: ["template_id", "file_id", "name"]
        ),
      output_schema: JsonSchema.object(%{"file" => JsonSchema.any_object()}, required: ["file"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, file_id} <- Helpers.decode_id(arguments["file_id"]),
         {:ok, description} <- Helpers.markdown_to_rich_text_nullable(arguments["description"]) do
      FileUpdate.call(conn, %{template_id: template_id, file_id: file_id, name: arguments["name"], description: description})
    end
  end
end
