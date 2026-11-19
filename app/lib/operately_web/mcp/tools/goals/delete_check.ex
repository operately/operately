defmodule OperatelyWeb.Mcp.Tools.Goals.DeleteCheck do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.GoalChecks.Delete, as: GoalCheckDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_goal_check",
      title: "Delete Goal Checklist Item",
      description:
        "Permanently deletes one goal checklist item. Checklist items are success criteria, and completed items count toward goal completion. This is separate from goal check-ins and numeric targets.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 218,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Delete a checklist item",
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
          %{"success" => JsonSchema.boolean("True when the checklist item is deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, check_id} <- Helpers.decode_id(arguments["check_id"]) do
      GoalCheckDelete.call(conn, %{goal_id: goal_id, check_id: check_id})
    end
  end
end
