defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteTask do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.DeleteTask
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_project_template_task",
      title: "Delete Project Template Task",
      description: "Deletes a task from a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 244,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Delete Project Template Task",
          "arguments" => %{"template_id" => "project_template_123", "task_id" => "template_task_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "task_id" => JsonSchema.string("The template task identifier.")
          },
          required: ["template_id", "task_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the task was deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]), {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]) do
      DeleteTask.call(conn, %{template_id: template_id, task_id: task_id})
    end
  end
end
