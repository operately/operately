defmodule OperatelyWeb.Mcp.Tools.Tasks.ListTaskStatuses do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.ListTaskStatuses, as: TaskStatusesList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_task_statuses",
      title: "List Task Statuses",
      description: "Lists statuses for a task or board, including an empty board. If both IDs are supplied they must match. Use this before update_task_status to discover valid status IDs, values, or labels.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 81,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "List statuses for a task", "arguments" => %{"task_id" => "task_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "board_id" => JsonSchema.string("The board identifier. Supply task_id or board_id.")
          }
        ),
      output_schema:
        JsonSchema.object(
          %{
            "board_id" => JsonSchema.nullable(JsonSchema.string("Resolved board identifier, or null for a project task.")),
            "task_statuses" => JsonSchema.array(JsonSchema.any_object(), description: "The statuses available for the task.")
          },
          required: ["task_statuses"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, task_id} <- Helpers.decode_optional_id(arguments["task_id"]),
         {:ok, board_id} <- Helpers.decode_optional_id(arguments["board_id"]) do
      TaskStatusesList.call(conn, %{task_id: task_id, board_id: board_id})
    end
  end
end
