defmodule OperatelyWeb.Mcp.Tools.Goals.Close do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.Close, as: GoalClose
  alias OperatelyWeb.Mcp.Helpers

  @valid_success_statuses ["achieved", "missed"]

  @impl true
  def definition do
    Definition.new!(
      name: "close_goal",
      title: "Close Goal",
      description: "Closes one goal with a retrospective and outcome.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 149,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "goals"},
      examples: [
        %{
          "title" => "Close a goal",
          "arguments" => %{
            "goal_id" => "goal_123",
            "success_status" => "achieved",
            "retrospective" => "We reached the target."
          }
        },
        %{
          "title" => "Close a goal and notify everyone",
          "arguments" => %{
            "goal_id" => "goal_123",
            "success_status" => "achieved",
            "retrospective" => "We reached the target.",
            "notify_everyone" => true
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "goal_id" => JsonSchema.string("The goal identifier."),
            "success_status" => JsonSchema.string("Whether the goal was achieved or missed.", enum: @valid_success_statuses),
            "retrospective" => JsonSchema.string("The closing retrospective in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this close. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this goal. Defaults to false."
              )
          },
          required: ["goal_id", "success_status", "retrospective"]
        ),
      output_schema:
        JsonSchema.object(
          %{"goal" => JsonSchema.any_object("The closed goal.")},
          required: ["goal"]
        )
    )
  end

  @impl true
  def call(conn, %{"goal_id" => goal_id, "success_status" => success_status, "retrospective" => retrospective} = arguments) do
    with {:ok, goal_id} <- Helpers.decode_id(goal_id),
         {:ok, success_status} <- decode_success_status(success_status),
         {:ok, retrospective} <- Helpers.markdown_to_rich_text(retrospective),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      GoalClose.call(
        conn,
        Map.merge(
          %{
            goal_id: goal_id,
            success_status: success_status,
            success: success_text(success_status),
            retrospective: retrospective
          },
          notification_inputs
        )
      )
    end
  end

  defp decode_success_status("achieved"), do: {:ok, :achieved}
  defp decode_success_status("missed"), do: {:ok, :missed}
  defp decode_success_status(_), do: {:error, :invalid_arguments}

  defp success_text(:achieved), do: "yes"
  defp success_text(:missed), do: "no"
end
