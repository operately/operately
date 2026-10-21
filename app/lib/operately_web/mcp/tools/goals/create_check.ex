defmodule OperatelyWeb.Mcp.Tools.Goals.CreateCheck do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.GoalChecks.Create, as: GoalCheckCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_goal_check",
      title: "Create Goal Checklist Item",
      description:
        "Adds one success-criteria item to a goal checklist. The item name can contain up to 2000 characters. Completed checklist items count toward goal completion. This is separate from goal check-ins and numeric targets. Use this instead of listing success criteria in the goal description or creating tasks.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 157,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Add a success criterion",
          "arguments" => %{
            "goal_id" => "goal_123",
            "name" => "Launch the onboarding rewrite"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "name" => JsonSchema.string("The checklist item name.")
          },
          required: ["goal_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "success" => JsonSchema.boolean("True when the checklist item is created."),
            "check_id" => JsonSchema.string("The created checklist item identifier.")
          },
          required: ["success", "check_id"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]) do
      GoalCheckCreate.call(conn, %{goal_id: goal_id, name: arguments["name"]})
    end
  end
end
