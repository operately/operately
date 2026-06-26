defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateParent do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.ChangeParent, as: GoalChangeParent
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_parent",
      title: "Update Goal Parent",
      description: "Connects a goal to a parent goal or clears the current parent.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 145,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Connect a child goal", "arguments" => %{"goal_id" => "goal_123", "parent_goal_id" => "goal_456"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "parent_goal_id" => JsonSchema.string("The parent goal identifier. Omit it to clear the current parent.")
          },
          required: ["goal_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"goal" => JsonSchema.any_object("The updated goal.")},
          required: ["goal"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(arguments["goal_id"]),
         {:ok, parent_goal_id} <- Helpers.decode_optional_id(arguments["parent_goal_id"]) do
      GoalChangeParent.call(conn, %{goal_id: goal_id, parent_goal_id: parent_goal_id})
    end
  end
end
