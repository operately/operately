defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateChampion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateChampion, as: GoalUpdateChampion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_champion",
      title: "Update Goal Champion",
      description: "Updates or clears the champion of one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 147,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Assign a goal champion", "arguments" => %{"goal_id" => "goal_123", "champion_id" => "person_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "champion_id" => JsonSchema.string("The new champion person identifier. Omit it to clear the champion.")
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
         {:ok, champion_id} <- Helpers.decode_optional_id(arguments["champion_id"]) do
      GoalUpdateChampion.call(conn, %{goal_id: goal_id, champion_id: champion_id})
    end
  end
end
