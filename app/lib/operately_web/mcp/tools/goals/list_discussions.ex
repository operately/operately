defmodule OperatelyWeb.Mcp.Tools.Goals.ListDiscussions do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.ListDiscussions, as: GoalDiscussionsList
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_goal_discussions",
      title: "List Goal Discussions",
      description: "Lists discussions for one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 55,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "List discussions for a goal", "arguments" => %{"goal_id" => "goal_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier.")
          },
          required: ["goal_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "discussions" => JsonSchema.array(JsonSchema.any_object(), description: "The goal discussions.")
          },
          required: ["discussions"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id}) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id) do
      GoalDiscussionsList.call(conn, %{goal_id: goal_id})
    end
  end
end
