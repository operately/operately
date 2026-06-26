defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateStatus do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateStatus, as: TaskUpdateStatus
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_status",
      title: "Update Task Status",
      description: "Updates the status of one task using a status ID, value, or label from that task's available statuses. Call list_task_statuses first to discover valid values.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 163,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Move a task to done", "arguments" => %{"task_id" => "task_123", "status" => "done"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "status" => JsonSchema.string("A status ID, status value, or status label from the task's current scope.")
          },
          required: ["task_id", "status"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task" => JsonSchema.any_object("The updated task.")},
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, %{"task_id" => task_id, "status" => status}) do
    with {:ok, task_id} <- Helpers.decode_id(task_id),
         {:ok, task} <- Helpers.load_task(conn.assigns.current_person, task_id),
         {:ok, type} <- Helpers.resolve_task_type(task),
         {:ok, status} <- Helpers.resolve_task_status(task, status) do
      TaskUpdateStatus.call(conn, %{task_id: task_id, status: Map.from_struct(status), type: type})
    end
  end
end
