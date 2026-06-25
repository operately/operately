defmodule OperatelyWeb.Mcp.Tools.Tasks.Get do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Tasks.Get, as: TaskGet

  @impl true
  def definition do
    Definition.new!(
      name: "get_task",
      title: "Get Task",
      description: "Returns one task by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 80,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Open a task by ID", "arguments" => %{"task_id" => "task_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier.")
          },
          required: ["task_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "task" => JsonSchema.any_object("The matching task.")
          },
          required: ["task"]
        )
    )
  end

  @impl true
  def call(conn, %{"task_id" => task_id}) do
    with {:ok, task_id} <- decode_task_id(task_id) do
      TaskGet.call(conn, %{id: task_id})
    end
  end

  defp decode_task_id(task_id) do
    case Helpers.decode_id(task_id) do
      {:ok, decoded_task_id} -> {:ok, decoded_task_id}
      {:error, _reason} -> {:error, :invalid_arguments}
    end
  end
end
