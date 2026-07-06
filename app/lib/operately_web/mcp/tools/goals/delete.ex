defmodule OperatelyWeb.Mcp.Tools.Goals.Delete do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.Delete, as: GoalDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_goal",
      title: "Delete Goal",
      description: "Permanently deletes one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 221,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Delete a goal", "arguments" => %{"goal_id" => "goal_123"}}],
      input_schema:
        JsonSchema.object(
          %{"goal_id" => JsonSchema.string("The goal identifier.")},
          required: ["goal_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"goal" => JsonSchema.any_object("The deleted goal.")},
          required: ["goal"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id) do
      GoalDelete.call(conn, %{goal_id: goal_id})
    end
  end
end
