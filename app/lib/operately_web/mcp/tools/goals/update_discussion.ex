defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.UpdateDiscussion, as: GoalUpdateDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "update_goal_discussion",
      title: "Update Goal Discussion",
      description: "Updates the title and body of one existing goal discussion.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 153,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [%{"title" => "Edit a goal discussion", "arguments" => %{"discussion_id" => "discussion_123", "title" => "Updated title", "content" => "Updated body"}}],
      input_schema:
        JsonSchema.object(
          %{
            "discussion_id" => JsonSchema.string("The goal discussion identifier."),
            "title" => JsonSchema.string("The updated discussion title."),
            "content" => JsonSchema.string("The updated discussion body in plain text or markdown.")
          },
          required: ["discussion_id", "title", "content"]
        ),
      output_schema:
        JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, %{"discussion_id" => discussion_id, "title" => title, "content" => content}) do
    with {:ok, discussion_id} <- Helpers.decode_id(discussion_id),
         {:ok, activity_id} <- Helpers.goal_discussion_activity_id(discussion_id),
         {:ok, content} <- Helpers.markdown_to_rich_text(content) do
      GoalUpdateDiscussion.call(conn, %{activity_id: activity_id, title: title, message: content})
    end
  end
end
