defmodule OperatelyWeb.Mcp.Tools.Goals.MoveToSpace do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateSpace, as: GoalMoveToSpace
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "move_goal_to_space",
      title: "Move Goal To Space",
      description: "Moves one goal to another space in the same company.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 146,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Move a goal", "arguments" => %{"goal_id" => "goal_123", "space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "space_id" => JsonSchema.string("The destination space identifier.")
          },
          required: ["goal_id", "space_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the move succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "space_id" => space_id}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id),
         {:ok, space_id} <- Helpers.decode_id(space_id) do
      GoalMoveToSpace.call(conn, %{goal_id: goal_id, space_id: space_id})
    end
  end
end
