defmodule OperatelyWeb.Mcp.Tools.Goals.CreateCheckIn do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.CreateCheckIn, as: GoalCreateCheckIn
  alias Operately.RichContent.FromMarkdown
  alias OperatelyWeb.Mcp.Helpers

  @valid_statuses ["on_track", "caution", "off_track"]

  @impl true
  def definition do
    Definition.new!(
      name: "create_goal_check_in",
      title: "Create Goal Check-In",
      description: "Creates a new goal check-in for one goal.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 112,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Create a goal check-in",
          "arguments" => %{
            "goal_id" => "growth-goal--abc123",
            "status" => "caution",
            "content" => "We are blocked on external dependencies."
          }
        },
        %{
          "title" => "Create a check-in and notify people",
          "arguments" => %{
            "goal_id" => "growth-goal--abc123",
            "status" => "on_track",
            "content" => "Progress is on track.",
            "notify_person_ids" => ["person_123"],
            "notify_everyone" => false
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "status" => JsonSchema.string("The goal status for this check-in.", enum: @valid_statuses),
            "content" => JsonSchema.string("Plain text or simple markdown content for the check-in."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this check-in. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this goal. Defaults to false."
              )
          },
          required: ["goal_id", "status", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "check_in" => JsonSchema.any_object("The created goal check-in.")
          },
          required: ["check_in"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "status" => status, "content" => content} = arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id),
         {:ok, rich_content} <- FromMarkdown.to_rich_text(content),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments),
         {:ok, %{update: check_in}} <-
           GoalCreateCheckIn.call(
             conn,
             Map.merge(
               %{
                 goal_id: goal_id,
                 status: status,
                 content: rich_content
               },
               notification_inputs
             )
           ) do
      {:ok, %{check_in: check_in}}
    end
  end
end
