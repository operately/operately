defmodule OperatelyWeb.Mcp.Tools.Goals.GetCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.GetCheckIn, as: GoalCheckInGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_goal_check_in",
      title: "Get Goal Check-In",
      description: "Returns one goal check-in by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 61,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Open a goal check-in by ID", "arguments" => %{"check_in_id" => "goal_update_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "check_in_id" => JsonSchema.string("The goal check-in identifier.")
          },
          required: ["check_in_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "check_in" => JsonSchema.any_object("The matching goal check-in.")
          },
          required: ["check_in"]
        )
    )
  end

  @impl true
  def call(conn, %{"check_in_id" => check_in_id}) do
    with {:ok, check_in_id} <- Helpers.decode_id(check_in_id),
         {:ok, %{update: check_in}} <- GoalCheckInGet.call(conn, %{id: check_in_id}) do
      {:ok, %{check_in: Map.put(check_in, :comments, Helpers.load_comments(conn, check_in_id, :goal_update))}}
    end
  end
end
