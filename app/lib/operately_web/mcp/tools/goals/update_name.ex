defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateName do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateName, as: GoalUpdateName
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_name",
      title: "Update Goal Name",
      description: "Updates the name of one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 141,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Rename a goal", "arguments" => %{"goal_id" => "goal_123", "name" => "New goal name"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "name" => JsonSchema.string("The new goal name.")
          },
          required: ["goal_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the update succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "name" => name}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id) do
      GoalUpdateName.call(conn, %{goal_id: goal_id, name: name})
    end
  end
end
