defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateCheck do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.GoalChecks.Update, as: GoalCheckUpdate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_check",
      title: "Update Goal Checklist Item",
      description:
        "Renames one goal checklist item. The item name can contain up to 2000 characters. Checklist items are success criteria, and completed items count toward goal completion. This is separate from goal check-ins and numeric targets.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 158,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Rename a checklist item",
          "arguments" => %{
            "goal_id" => "goal_123",
            "check_id" => "check_123",
            "name" => "Ship the onboarding rewrite"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "check_id" => JsonSchema.string("The checklist item identifier."),
            "name" => JsonSchema.string("The new checklist item name.")
          },
          required: ["goal_id", "check_id", "name"]
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
         {:ok, check_id} <- Helpers.decode_id(arguments["check_id"]) do
      GoalCheckUpdate.call(conn, %{goal_id: goal_id, check_id: check_id, name: arguments["name"]})
    end
  end
end
