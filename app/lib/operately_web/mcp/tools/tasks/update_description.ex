defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateDescription do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateDescription, as: TaskUpdateDescription
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_description",
      title: "Update Task Description",
      description: "Updates or clears the markdown description of one task.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 162,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Change a task description", "arguments" => %{"task_id" => "task_123", "description" => "Updated task description"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "description" => JsonSchema.string("The new plain text or markdown description. Omit it or use an empty string to clear it.")
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
         {:ok, description} <- decode_description(arguments["description"]) do
      TaskUpdateDescription.call(conn, %{task_id: task_id, description: description, type: type})
    end
  end

  defp decode_description(nil), do: Helpers.markdown_to_rich_text_allow_blank("")
  defp decode_description(description), do: Helpers.markdown_to_rich_text_allow_blank(description)
end
