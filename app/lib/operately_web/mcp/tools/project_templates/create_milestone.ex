defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateMilestone do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateMilestone
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_milestone",
      title: "Create Project Template Milestone",
      description: "Adds a milestone with a due-date offset to a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 238,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template Milestone",
          "arguments" => %{"template_id" => "project_template_123", "title" => "Launch", "due_offset_days" => 30}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "title" => JsonSchema.string("The milestone title."),
            "description" => JsonSchema.nullable(JsonSchema.string("Optional Markdown description.")),
            "due_offset_days" => JsonSchema.nullable(JsonSchema.integer("Days after project start; null leaves the milestone undated.", minimum: 0))
          },
          required: ["template_id", "title"]
        ),
      output_schema: JsonSchema.object(%{"milestone" => JsonSchema.any_object()}, required: ["milestone"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, description} <- Helpers.markdown_to_rich_text_nullable(arguments["description"]) do
      CreateMilestone.call(conn, %{template_id: template_id, title: arguments["title"], description: description, due_offset_days: arguments["due_offset_days"]})
    end
  end
end
