defmodule OperatelyWeb.Mcp.Tools.Goals.AcknowledgeCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.AcknowledgeCheckIn, as: GoalAcknowledgeCheckIn
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "acknowledge_goal_check_in",
      title: "Acknowledge Goal Check-In",
      description: "Acknowledges one goal check-in.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 151,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Acknowledge a goal check-in", "arguments" => %{"check_in_id" => "check_in_123"}}],
      input_schema:
        JsonSchema.object(
          %{"check_in_id" => JsonSchema.string("The goal check-in identifier.")},
          required: ["check_in_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"update" => JsonSchema.any_object("The acknowledged goal check-in.")},
          required: ["update"]
        )
    )
  end

  @impl true
  def call(conn, %{"check_in_id" => check_in_id}) do
    with {:ok, check_in_id} <- Helpers.decode_id(check_in_id) do
      GoalAcknowledgeCheckIn.call(conn, %{id: check_in_id})
    end
  end
end
