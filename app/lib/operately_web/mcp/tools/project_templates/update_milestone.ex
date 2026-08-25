defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateMilestone do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateMilestone, as: MilestoneUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_milestone",
      title: "Update Project Template Milestone",
      description: "Updates selected milestone fields. Omitted fields remain unchanged; null clears nullable fields.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 239,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Milestone",
          "arguments" => %{"template_id" => "project_template_123", "milestone_id" => "template_milestone_123", "due_offset_days" => 45}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "milestone_id" => JsonSchema.string("The template milestone identifier."),
            "title" => JsonSchema.string("A replacement title."),
            "description" => JsonSchema.nullable(JsonSchema.string("Markdown description; null clears it.")),
            "due_offset_days" => JsonSchema.nullable(JsonSchema.integer("Days after project start; null clears it.", minimum: 0))
          },
          required: ["template_id", "milestone_id"]
        ),
      output_schema: JsonSchema.object(%{"milestone" => JsonSchema.any_object()}, required: ["milestone"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, milestone_id} <- Helpers.decode_id(arguments["milestone_id"]),
         {:ok, inputs} <- Helpers.put_present(%{template_id: template_id, milestone_id: milestone_id}, arguments, "title", :title),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "description", :description, &Helpers.markdown_to_rich_text_nullable/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "due_offset_days", :due_offset_days) do
      MilestoneUpdate.call(conn, inputs)
    end
  end
end
