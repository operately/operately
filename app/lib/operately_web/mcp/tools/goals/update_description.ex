defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateDescription do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateDescription, as: GoalUpdateDescription
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_description",
      title: "Update Goal Description",
      description: "Updates the markdown description of one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 142,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Change a goal description", "arguments" => %{"goal_id" => "goal_123", "description" => "Updated description"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "description" => JsonSchema.string("The new plain text or markdown description. Use an empty string to clear it.")
          },
          required: ["goal_id", "description"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the update succeeds.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "description" => description}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id),
         {:ok, description} <- Helpers.markdown_to_rich_text_allow_blank(description) do
      GoalUpdateDescription.call(conn, %{goal_id: goal_id, description: description})
    end
  end
end
