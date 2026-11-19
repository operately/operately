defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateArchive do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateArchive, as: TaskUpdateArchive
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_archive",
      title: "Update Task Archive",
      description: "Archives a closed task without deleting its history, or restores an archived task to its board. Its status is preserved.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 166,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Archive a closed task", "arguments" => %{"task_id" => "task_123", "archived" => true}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "archived" => JsonSchema.boolean("True to archive a closed task; false to restore it to its board.")
          },
          required: ["task_id", "archived"]
        ),
      output_schema:
        JsonSchema.object(
          %{"task" => JsonSchema.any_object("The updated task.")},
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, %{"task_id" => task_id, "archived" => archived}) when is_boolean(archived) do
    with {:ok, task_id} <- Helpers.decode_id(task_id) do
      TaskUpdateArchive.call(conn, %{task_id: task_id, archived: archived})
    end
  end

  def call(_conn, _args), do: {:error, :invalid_arguments}
end
