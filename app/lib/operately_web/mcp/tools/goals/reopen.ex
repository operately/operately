defmodule OperatelyWeb.Mcp.Tools.Goals.Reopen do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.Reopen, as: GoalReopen
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "reopen_goal",
      title: "Reopen Goal",
      description: "Reopens one closed goal and posts a reopening message.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 150,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Reopen a goal",
          "arguments" => %{"goal_id" => "goal_123", "message" => "We need to continue this work."}
        },
        %{
          "title" => "Reopen a goal and notify people",
          "arguments" => %{
            "goal_id" => "goal_123",
            "message" => "We need to continue this work.",
            "notify_person_ids" => ["person_123"]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "message" => JsonSchema.string("The reopening message in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this reopen. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this goal. Defaults to false."
              )
          },
          required: ["goal_id", "message"]
        ),
      output_schema:
        JsonSchema.object(
          %{"goal" => JsonSchema.any_object("The reopened goal.")},
          required: ["goal"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "message" => message} = arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id),
         {:ok, message} <- Helpers.markdown_to_rich_text(message),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      GoalReopen.call(
        conn,
        Map.merge(
          %{
            id: goal_id,
            message: message
          },
          notification_inputs
        )
      )
    end
  end
end
