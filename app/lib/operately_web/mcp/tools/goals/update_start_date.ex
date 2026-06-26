defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateStartDate do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateStartDate, as: GoalUpdateStartDate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_start_date",
      title: "Update Goal Start Date",
      description: "Updates or clears the start date of one goal using an ISO date.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 143,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Change a goal start date", "arguments" => %{"goal_id" => "goal_123", "start_date" => "2026-07-01"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "start_date" => JsonSchema.string("The new ISO date, for example 2026-07-01. Omit it to clear the start date.")
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
         {:ok, start_date} <- Helpers.parse_day_date(arguments["start_date"]) do
      GoalUpdateStartDate.call(conn, %{goal_id: goal_id, start_date: start_date})
    end
  end
end
