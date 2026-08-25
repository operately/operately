defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateTask do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.UpdateTask, as: TaskUpdate
  alias OperatelyWeb.Mcp.Helpers

  @reminder_types ~w(before_due due_day overdue)

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_task",
      title: "Update Project Template Task",
      description: "Updates selected template task fields. Omitted fields remain unchanged; null clears nullable fields.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 242,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Task",
          "arguments" => %{
            "template_id" => "project_template_123",
            "task_id" => "template_task_123",
            "name" => "Prepare launch plan"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "task_id" => JsonSchema.string("The template task identifier."),
            "name" => JsonSchema.string("A replacement name."),
            "description" => JsonSchema.string("A replacement Markdown description; use an empty string to clear it."),
            "priority" => JsonSchema.nullable(JsonSchema.string("Task priority; null clears it.")),
            "size" => JsonSchema.nullable(JsonSchema.string("Task size; null clears it.")),
            "due_offset_days" => JsonSchema.nullable(JsonSchema.integer("Days after project start; null clears it.", minimum: 0)),
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
              )
          },
          required: ["template_id", "task_id"]
        ),
      output_schema: JsonSchema.object(%{"task" => JsonSchema.any_object()}, required: ["task"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]),
         {:ok, inputs} <- Helpers.put_present(%{template_id: template_id, task_id: task_id}, arguments, "name", :name),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "description", :description, &Helpers.markdown_to_rich_text_allow_blank/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "priority", :priority),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "size", :size),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "due_offset_days", :due_offset_days),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "reminders", :reminders, &Helpers.decode_task_reminders/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "task_status", :task_status, &Helpers.decode_template_task_status/1) do
      TaskUpdate.call(conn, inputs)
    end
  end
end
