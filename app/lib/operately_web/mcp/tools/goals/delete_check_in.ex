defmodule OperatelyWeb.Mcp.Tools.Goals.DeleteCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.DeleteCheckIn, as: GoalDeleteCheckIn
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_goal_check_in",
      title: "Delete Goal Check-In",
      description: "Permanently deletes one goal check-in.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 213,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Delete a goal check-in", "arguments" => %{"check_in_id" => "check_in_123"}}],
      input_schema:
        JsonSchema.object(
          %{"check_in_id" => JsonSchema.string("The goal check-in identifier.")},
          required: ["check_in_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the check-in is deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"check_in_id" => check_in_id}) do
    with {:ok, check_in_id} <- Helpers.decode_id(check_in_id),
         {:ok, %{success: true}} <- GoalDeleteCheckIn.call(conn, %{id: check_in_id}) do
      {:ok, %{success: true}}
    end
  end
end
