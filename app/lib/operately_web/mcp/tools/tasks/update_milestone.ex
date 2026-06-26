defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateMilestone do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Tasks.UpdateMilestone, as: TaskUpdateMilestone
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_task_milestone",
      title: "Update Task Milestone",
      description: "Moves one project task into a milestone or clears its milestone.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 166,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "tasks"},
      examples: [%{"title" => "Assign a task to a milestone", "arguments" => %{"task_id" => "task_123", "milestone_id" => "milestone_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "task_id" => JsonSchema.string("The task identifier."),
            "milestone_id" => JsonSchema.string("The milestone identifier. Omit it to clear the milestone.")
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
         {:ok, :project} <- Helpers.resolve_task_type(task),
         {:ok, milestone_id} <- Helpers.decode_optional_id(arguments["milestone_id"]) do
      TaskUpdateMilestone.call(conn, %{task_id: task_id, milestone_id: milestone_id})
    else
      {:ok, :space} -> {:error, :invalid_arguments}
      error -> error
    end
  end
end
