defmodule OperatelyWeb.Mcp.Tools.Goals.ToggleCheck do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.GoalChecks.Toggle, as: GoalCheckToggle
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "toggle_goal_check",
      title: "Toggle Goal Checklist Item",
      description:
        "Toggles whether one goal checklist item is complete. Completed checklist items count toward goal completion. This is separate from goal check-ins and numeric targets.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 159,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Mark a checklist item complete or incomplete",
          "arguments" => %{"goal_id" => "goal_123", "check_id" => "check_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "check_id" => JsonSchema.string("The checklist item identifier.")
          },
          required: ["goal_id", "check_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the checklist item is toggled.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, check_id} <- Helpers.decode_id(arguments["check_id"]) do
      GoalCheckToggle.call(conn, %{goal_id: goal_id, check_id: check_id})
    end
  end
end
