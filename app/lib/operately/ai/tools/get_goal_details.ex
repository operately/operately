defmodule Operately.AI.Tools.GetGoalDetails do
  alias Operately.AI.Tools.Base

  @doc """
  Provides details of a goal.

  Expects the following arguments:
  - "id": The ID of the goal for which details are requested.

  Expected context:
  - :person - The person requesting the goal details.
  - :agent_run_id - The ID of the agent run.
  """
  def get_goal_details do
    Base.new_tool(%{
      name: "get_goal_details",
      description: "Returns the details of the goal.",
      parameters_schema: %{
        type: "object",
        properties: %{
          id: %{
            type: "string",
            description: "The ID of the goal."
          }
        },
        required: ["id"]
      },
      function: fn args, context ->
        case OperatelyWeb.Api.Helpers.decode_id(Map.get(args, "id")) do
          {:ok, id} ->
            me = Map.get(context, :person)
            conn = %{assigns: %{current_person: me}}
            args = %{id: id}

            {:ok, goal} = OperatelyWeb.Api.Queries.GetGoal.call(conn, args)
            {:ok, as_markdown(goal)}

          {:error, _} ->
            {:error, "Invalid goal ID format."}
        end
      end
    })
  end

  def as_markdown(goal) do
    ""
  end
end
