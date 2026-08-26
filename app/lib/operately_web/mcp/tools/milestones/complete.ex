defmodule OperatelyWeb.Mcp.Tools.Milestones.Complete do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.CreateMilestoneComment, as: MilestoneCommentCreate
  alias OperatelyWeb.Mcp.Helpers

  @open_task_resolution_actions ["move_to_no_milestone", "set_status"]

  @impl true
  def definition do
    Definition.new!(
      name: "complete_milestone",
      title: "Complete Milestone",
      description: "Marks one milestone as complete. When it has open tasks, choose whether to move them out of the milestone or close them with a selected task status.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 174,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "milestones"},
      examples: [
        %{"title" => "Complete a milestone without open tasks", "arguments" => %{"milestone_id" => "milestone_123"}},
        %{
          "title" => "Complete a milestone and move its open tasks",
          "arguments" => %{
            "milestone_id" => "milestone_123",
            "open_tasks_resolution" => %{"action" => "move_to_no_milestone"}
          }
        },
        %{
          "title" => "Complete a milestone and close its open tasks",
          "arguments" => %{
            "milestone_id" => "milestone_123",
            "open_tasks_resolution" => %{"action" => "set_status", "status_id" => "550e8400-e29b-41d4-a716-446655440000"}
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "milestone_id" => JsonSchema.string("The milestone identifier."),
            "open_tasks_resolution" =>
              JsonSchema.object(
                %{
                  "action" => JsonSchema.string("What to do with open tasks.", enum: @open_task_resolution_actions),
                  "status_id" => JsonSchema.string("The closed task status identifier. Required when action is set_status.")
                },
                required: ["action"]
              )
          },
          required: ["milestone_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"comment" => JsonSchema.any_object("The milestone comment created for the action.")},
          required: ["comment"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, milestone_id} <- Helpers.decode_id(arguments["milestone_id"]),
         {:ok, open_tasks_resolution} <- decode_open_tasks_resolution(arguments["open_tasks_resolution"]) do
      inputs =
        %{milestone_id: milestone_id, action: "complete", content: nil}
        |> Helpers.put_optional(:open_tasks_resolution, open_tasks_resolution)

      MilestoneCommentCreate.call(conn, inputs)
    end
  end

  defp decode_open_tasks_resolution(nil), do: {:ok, nil}

  defp decode_open_tasks_resolution(%{"action" => "move_to_no_milestone"}) do
    {:ok, %{action: :move_to_no_milestone}}
  end

  defp decode_open_tasks_resolution(%{"action" => "set_status", "status_id" => status_id}) do
    with {:ok, status_id} <- Helpers.decode_id(status_id) do
      {:ok, %{action: :set_status, status_id: status_id}}
    end
  end

  defp decode_open_tasks_resolution(_resolution), do: {:error, :invalid_arguments}
end
