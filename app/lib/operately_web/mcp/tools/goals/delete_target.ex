defmodule OperatelyWeb.Mcp.Tools.Goals.DeleteTarget do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.DeleteTarget, as: GoalDeleteTarget
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_goal_target",
      title: "Delete Goal Target",
      description: "Permanently deletes one goal target.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 219,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Delete a goal target",
          "arguments" => %{"goal_id" => "goal_123", "target_id" => "target_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "target_id" => JsonSchema.string("The target identifier.")
          },
          required: ["goal_id", "target_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the target is deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, target_id} <- Helpers.decode_id(arguments["target_id"]) do
      GoalDeleteTarget.call(conn, %{goal_id: goal_id, target_id: target_id})
    end
  end
end
