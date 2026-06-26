defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateDueDate do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateDueDate, as: GoalUpdateDueDate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_due_date",
      title: "Update Goal Due Date",
      description: "Updates or clears the due date of one goal using an ISO date.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 144,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Change a goal due date", "arguments" => %{"goal_id" => "goal_123", "due_date" => "2026-08-01"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "due_date" => JsonSchema.string("The new ISO date, for example 2026-08-01. Omit it to clear the due date.")
          },
          required: ["goal_id"]
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
         {:ok, due_date} <- Helpers.parse_day_date(arguments["due_date"]) do
      GoalUpdateDueDate.call(conn, %{goal_id: goal_id, due_date: due_date})
    end
  end
end
