defmodule OperatelyWeb.Mcp.Tools.Tasks.Delete do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.Delete, as: TaskDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_task",
      title: "Delete Task",
      description: "Permanently deletes one project or space task.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 211,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Delete a task", "arguments" => %{"task_id" => "task_123"}}],
      input_schema:
        JsonSchema.object(
          %{"task_id" => JsonSchema.string("The task identifier.")},
          required: ["task_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "success" => JsonSchema.boolean("True when the task is deleted."),
            "updated_milestone" => JsonSchema.any_object("The updated milestone when a project task is deleted.")
          },
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"task_id" => task_id}) do
    with {:ok, task_id} <- Helpers.decode_id(task_id),
         {:ok, task} <- Helpers.load_task(conn.assigns.current_person, task_id),
         {:ok, type} <- Helpers.resolve_task_type(task) do
      TaskDelete.call(conn, %{task_id: task_id, type: type})
    end
  end
end
