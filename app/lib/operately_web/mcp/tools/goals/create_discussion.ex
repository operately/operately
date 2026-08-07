defmodule OperatelyWeb.Mcp.Tools.Goals.CreateDiscussion do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.CreateDiscussion, as: GoalCreateDiscussion
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_goal_discussion",
      title: "Create Goal Discussion",
      description: "Creates a new discussion for one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 152,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Start a goal discussion",
          "arguments" => %{"goal_id" => "goal_123", "title" => "Risks", "content" => "We need to discuss risks."}
        },
        %{
          "title" => "Start a discussion and notify people",
          "arguments" => %{
            "goal_id" => "goal_123",
            "title" => "Risks",
            "content" => "We need to discuss risks.",
            "notify_person_ids" => ["person_123"]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "title" => JsonSchema.string("The discussion title."),
            "content" => JsonSchema.string("The discussion body in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this discussion. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this goal. Defaults to false."
              )
          },
          required: ["goal_id", "title", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "discussion" => JsonSchema.any_object("The created discussion."),
            "activity_id" => JsonSchema.string("The backing activity identifier.")
          },
          required: ["discussion", "activity_id"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "title" => title, "content" => content} = arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id),
         {:ok, content} <- Helpers.markdown_to_rich_text(content),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      GoalCreateDiscussion.call(
        conn,
        Map.merge(
          %{
            goal_id: goal_id,
            title: title,
            message: content
          },
          notification_inputs
        )
      )
    end
  end
end
