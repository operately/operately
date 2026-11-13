defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateReminders do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateReminders, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_reminders",
      title: "Update Task Reminders",
      description: "Replaces task reminders. Use an empty array to remove reminders.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 166,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Update task reminders", "arguments" => %{"task_id" => "task_123", "reminders" => [%{"type" => "due_day"}]}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task id."),
            "reminders" =>
              JsonSchema.array(
                JsonSchema.object(
                  %{
                    "type" => JsonSchema.string("Reminder type.", enum: ["before_due", "due_day", "overdue", "on_date"]),
                    "date" => JsonSchema.string("Date in YYYY-MM-DD format; required for on_date.", format: "date"),
                    "days" => JsonSchema.integer("Days before the due date; required for before_due.", minimum: 1)
                  },
                  required: ["type"]
                )
              )
          },
          required: ["task_id", "reminders"]
        ),
      output_schema: JsonSchema.object(%{"task" => JsonSchema.any_object()}, required: ["task"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]),
         {:ok, task} <- Helpers.load_task(conn.assigns.current_person, task_id),
         {:ok, type} <- Helpers.resolve_task_type(task),
         {:ok, reminders} <- Helpers.decode_task_reminders(arguments["reminders"]) do
      Api.call(conn, %{task_id: task_id, type: type, reminders: reminders})
    end
  end
end
