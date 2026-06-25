defmodule OperatelyWeb.Mcp.Tools.Milestones.ListTasks do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Milestones.ListTasks, as: MilestoneTasksList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_milestone_tasks",
      title: "List Milestone Tasks",
      description: "Lists tasks for one milestone.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 46,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "List tasks for a milestone", "arguments" => %{"milestone_id" => "milestone_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "milestone_id" => JsonSchema.string("The milestone identifier.")
          },
          required: ["milestone_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "tasks" => JsonSchema.array(JsonSchema.any_object(), description: "The milestone tasks.")
          },
          required: ["tasks"]
        )
    )
  end

  @impl true
  def call(conn, %{"milestone_id" => milestone_id}) do
    with {:ok, milestone_id} <- Helpers.decode_id(milestone_id) do
      MilestoneTasksList.call(conn, %{milestone_id: milestone_id})
    end
  end
end
