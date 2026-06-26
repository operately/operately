defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateDueDate do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateDueDate, as: TaskUpdateDueDate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_due_date",
      title: "Update Task Due Date",
      description: "Updates or clears the due date of one task using an ISO date.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 164,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Change a task due date", "arguments" => %{"task_id" => "task_123", "due_date" => "2026-07-01"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "due_date" => JsonSchema.string("The new ISO date, for example 2026-07-01. Omit it to clear the due date.")
          },
          required: ["task_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task" => JsonSchema.any_object("The updated task.")},
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, task_id} <- Helpers.decode_id(arguments["task_id"]),
         {:ok, task} <- Helpers.load_task(conn.assigns.current_person, task_id),
         {:ok, type} <- Helpers.resolve_task_type(task),
         {:ok, due_date} <- Helpers.parse_day_date(arguments["due_date"]) do
      TaskUpdateDueDate.call(conn, %{
        task_id: task_id,
        due_date: encode_due_date(due_date),
        type: type
      })
    end
  end

  defp encode_due_date(nil), do: nil
  defp encode_due_date(due_date), do: Map.from_struct(due_date)
end
