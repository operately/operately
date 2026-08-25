defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.MoveTask do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateMilestoneAndOrdering
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "move_project_template_task",
      title: "Move Project Template Task",
      description: "Moves a template task to a milestone and zero-based position. A null milestone moves it to the unassigned list.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 243,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Move Project Template Task",
          "arguments" => %{
            "template_id" => "project_template_123",
            "task_id" => "template_task_123",
            "milestone_id" => "template_milestone_123",
            "index" => 0
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "task_id" => JsonSchema.string("The template task identifier."),
            "milestone_id" => JsonSchema.nullable(JsonSchema.string("The destination milestone identifier.")),
            "index" => JsonSchema.integer("The zero-based destination position.", minimum: 0)
          },
          required: ["template_id", "task_id", "milestone_id", "index"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task" => JsonSchema.any_object()},
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, %{"index" => index} = arguments) when is_integer(index) and index >= 0 do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]),
         {:ok, milestone_id} <- Helpers.decode_optional_id(arguments["milestone_id"]) do
      UpdateMilestoneAndOrdering.call(conn, %{template_id: template_id, task_id: task_id, milestone_id: milestone_id, index: index})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
