defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteMilestone do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.DeleteMilestone
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_project_template_milestone",
      title: "Delete Project Template Milestone",
      description: "Deletes a milestone from a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 240,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Delete Project Template Milestone",
          "arguments" => %{"template_id" => "project_template_123", "milestone_id" => "template_milestone_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "milestone_id" => JsonSchema.string("The template milestone identifier.")
          },
          required: ["template_id", "milestone_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the milestone was deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]), {:ok, milestone_id} <- Helpers.decode_id(arguments["milestone_id"]) do
      DeleteMilestone.call(conn, %{template_id: template_id, milestone_id: milestone_id})
    end
  end
end
