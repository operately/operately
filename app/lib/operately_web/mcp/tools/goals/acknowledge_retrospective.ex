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
      examples: [%{"title" => "Acknowledge a goal retrospective", "arguments" => %{"retrospective_id" => "activity_123"}}],
      input_schema:
        JsonSchema.object(
          %{"retrospective_id" => JsonSchema.string("The goal closing activity identifier.")},
          required: ["retrospective_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"activity" => JsonSchema.any_object("The acknowledged goal closing activity.")},
          required: ["activity"]
        )
    )
  end

  @impl true
  def call(conn, %{"retrospective_id" => retrospective_id}) do
    with {:ok, retrospective_id} <- Helpers.decode_id(retrospective_id) do
      GoalAcknowledgeRetrospective.call(conn, %{id: retrospective_id})
    end
  end
end
