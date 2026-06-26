defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateReviewer do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateReviewer, as: GoalUpdateReviewer
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_reviewer",
      title: "Update Goal Reviewer",
      description: "Updates or clears the reviewer of one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 148,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Assign a goal reviewer", "arguments" => %{"goal_id" => "goal_123", "reviewer_id" => "person_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "reviewer_id" => JsonSchema.string("The new reviewer person identifier. Omit it to clear the reviewer.")
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
         {:ok, reviewer_id} <- Helpers.decode_optional_id(arguments["reviewer_id"]) do
      GoalUpdateReviewer.call(conn, %{goal_id: goal_id, reviewer_id: reviewer_id})
    end
  end
end
