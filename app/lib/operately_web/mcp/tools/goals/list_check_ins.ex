defmodule OperatelyWeb.Mcp.Tools.Goals.ListCheckIns do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Queries.ListGoalCheckIns, as: GoalCheckInsList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_goal_check_ins",
      title: "List Goal Check-Ins",
      description: "Lists check-ins for one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 56,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "List check-ins for a goal", "arguments" => %{"goal_id" => "goal_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier.")
          },
          required: ["goal_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "check_ins" => JsonSchema.array(JsonSchema.any_object(), description: "The goal check-ins.")
          },
          required: ["check_ins"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id) do
      GoalCheckInsList.call(conn, %{goal_id: goal_id})
    end
  end
end
