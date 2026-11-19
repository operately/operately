defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateTargetValue do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateTargetValue, as: GoalUpdateTargetValue
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_target_value",
      title: "Update Goal Target Value",
      description: "Updates the current value of one goal target.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 156,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Record the current target value",
          "arguments" => %{
            "goal_id" => "goal_123",
            "target_id" => "target_123",
            "value" => 42.5
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "target_id" => JsonSchema.string("The target identifier."),
            "value" => JsonSchema.number("The current value of the target.")
          },
          required: ["goal_id", "target_id", "value"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the update succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, target_id} <- Helpers.decode_id(arguments["target_id"]) do
      GoalUpdateTargetValue.call(conn, %{
        goal_id: goal_id,
        target_id: target_id,
        value: arguments["value"]
      })
    end
  end
end
