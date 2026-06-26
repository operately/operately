defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateName do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateName, as: TaskUpdateName
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_name",
      title: "Update Task Name",
      description: "Updates the name of one task.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 161,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Rename a task", "arguments" => %{"task_id" => "task_123", "name" => "Updated task name"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "name" => JsonSchema.string("The new task name.")
          },
          required: ["task_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task" => JsonSchema.any_object("The updated task.")},
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, %{"task_id" => task_id, "name" => name}) do
    with {:ok, task_id} <- Helpers.decode_id(task_id),
         {:ok, task} <- Helpers.load_task(conn.assigns.current_person, task_id),
         {:ok, type} <- Helpers.resolve_task_type(task) do
      TaskUpdateName.call(conn, %{task_id: task_id, name: name, type: type})
    end
  end
end
