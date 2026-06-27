defmodule OperatelyWeb.Mcp.Tools.Milestones.UpdateDueDate do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Milestones.UpdateDueDate, as: MilestoneUpdateDueDate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_milestone_due_date",
      title: "Update Milestone Due Date",
      description: "Updates or clears the due date of one milestone using an ISO date.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 173,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [%{"title" => "Change a milestone due date", "arguments" => %{"milestone_id" => "milestone_123", "due_date" => "2026-08-15"}}],
      input_schema:
        JsonSchema.object(
          %{
            "milestone_id" => JsonSchema.string("The milestone identifier."),
            "due_date" => JsonSchema.string("The new ISO date, for example 2026-08-15. Omit it to clear the due date.")
          },
          required: ["milestone_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"milestone" => JsonSchema.any_object("The updated milestone.")},
          required: ["milestone"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, milestone_id} <- Helpers.decode_id(arguments["milestone_id"]),
         {:ok, due_date} <- Helpers.parse_day_date(arguments["due_date"]) do
      MilestoneUpdateDueDate.call(conn, %{milestone_id: milestone_id, due_date: due_date})
    end
  end
end
