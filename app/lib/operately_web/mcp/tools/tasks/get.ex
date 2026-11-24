defmodule OperatelyWeb.Mcp.Tools.Tasks.Get do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.Get, as: TaskGet
  alias OperatelyWeb.Mcp.Helpers

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
    with {:ok, task_id} <- Helpers.decode_id(task_id),
         {:ok, %{task: task}} <- TaskGet.call(conn, %{id: task_id}) do
      comments = Helpers.load_comments(conn, task_id, comment_type(task.type))

      {:ok, %{task: Map.put(task, :comments, comments)}}
    end
  end

  defp comment_type("project"), do: :project_task
  defp comment_type("space"), do: :space_task
end
