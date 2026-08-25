defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateTaskAssignees do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateTaskAssignees
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_task_assignees",
      title: "Update Project Template Task Assignees",
      description: "Replaces the complete assignee list of a template task using company person identifiers.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 245,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Task Assignees",
          "arguments" => %{"template_id" => "project_template_123", "task_id" => "template_task_123", "assignee_ids" => ["person_123"]}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "task_id" => JsonSchema.string("The template task identifier."),
            "assignee_ids" => JsonSchema.array(JsonSchema.string("A company person identifier."))
          },
          required: ["template_id", "task_id", "assignee_ids"]
        ),
      output_schema:
        JsonSchema.object(
          %{"assignments" => JsonSchema.array(JsonSchema.any_object())},
          required: ["assignments"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]),
         {:ok, assignee_ids} <- Helpers.decode_id_list(arguments["assignee_ids"]) do
      UpdateTaskAssignees.call(conn, %{template_id: template_id, task_id: task_id, assignee_ids: assignee_ids})
      |> Helpers.present_project_template_result()
    end
  end
end
