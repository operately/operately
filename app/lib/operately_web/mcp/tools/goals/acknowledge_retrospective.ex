defmodule OperatelyWeb.Mcp.Tools.Goals.AcknowledgeRetrospective do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.AcknowledgeRetrospective, as: GoalAcknowledgeRetrospective
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "acknowledge_goal_retrospective",
      title: "Acknowledge Goal Retrospective",
      description: "Acknowledges one goal retrospective.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 152,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Acknowledge a goal retrospective", "arguments" => %{"goal_id" => "goal_123"}}],
      input_schema:
        JsonSchema.object(
          %{"goal_id" => JsonSchema.string("The goal identifier.")},
          required: ["goal_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"activity" => JsonSchema.any_object("The acknowledged goal closing activity.")},
          required: ["activity"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id) do
      GoalAcknowledgeRetrospective.call(conn, %{goal_id: goal_id})
    end
  end
end
