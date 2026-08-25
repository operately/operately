defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateTask do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.CreateTask
  alias OperatelyWeb.Mcp.Helpers

  @reminder_types ~w(before_due due_day overdue)

  @impl true
  def definition do
    Definition.new!(
      name: "create_project_template_task",
      title: "Create Project Template Task",
      description: "Adds a task to a project template with optional milestone, due offset, reminders, status, and assignees.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 241,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Create Project Template Task",
          "arguments" => %{
            "template_id" => "project_template_123",
            "name" => "Prepare launch",
            "due_offset_days" => 14,
            "reminders" => [%{"type" => "before_due", "days" => 2}]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "milestone_id" => JsonSchema.nullable(JsonSchema.string("Optional template milestone identifier.")),
            "name" => JsonSchema.string("The task name."),
            "description" => JsonSchema.nullable(JsonSchema.string("Optional Markdown description.")),
            "priority" => JsonSchema.nullable(JsonSchema.string("Optional task priority.")),
            "size" => JsonSchema.nullable(JsonSchema.string("Optional task size.")),
            "due_offset_days" => JsonSchema.nullable(JsonSchema.integer("Days after project start.", minimum: 0)),
            "reminders" =>
              JsonSchema.array(
                JsonSchema.object(
                  %{
                    "type" => JsonSchema.string("Due-relative reminder type.", enum: @reminder_types),
                    "days" => JsonSchema.nullable(JsonSchema.integer("Days before or after the due date.", minimum: 1))
                  },
                  required: ["type"]
                )
              ),
            "task_status" =>
              JsonSchema.object(
                %{"id" => JsonSchema.string("A status ID returned by get_project_template.")},
                required: ["id"]
              ),
            "assignee_ids" => JsonSchema.array(JsonSchema.string("A company person identifier."))
          },
          required: ["template_id", "name"]
        ),
      output_schema: JsonSchema.object(%{"task" => JsonSchema.any_object()}, required: ["task"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, milestone_id} <- Helpers.decode_optional_id(arguments["milestone_id"]),
         {:ok, description} <- Helpers.markdown_to_rich_text_nullable(arguments["description"]),
         {:ok, reminders} <- decode_optional_reminders(arguments["reminders"]),
         {:ok, task_status} <- decode_optional_status(arguments["task_status"]),
         {:ok, assignee_ids} <- Helpers.decode_id_list(arguments["assignee_ids"]) do
      CreateTask.call(conn, %{
        template_id: template_id,
        milestone_id: milestone_id,
        name: arguments["name"],
        description: description,
        priority: arguments["priority"],
        size: arguments["size"],
        due_offset_days: arguments["due_offset_days"],
        reminders: reminders,
        task_status: task_status,
        assignee_ids: assignee_ids
      })
    end
  end

  defp decode_optional_reminders(nil), do: {:ok, nil}
  defp decode_optional_reminders(value), do: Helpers.decode_task_reminders(value)
  defp decode_optional_status(nil), do: {:ok, nil}
  defp decode_optional_status(value), do: Helpers.decode_template_task_status(value)
end
