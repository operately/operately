defmodule Operately.AI.Tools do
  alias LangChain.Function

  @moduledoc """
  Provides AI tools for interacting with Operately's API.
  """

  @doc """
  Provides details of a goal.

  Expects the following arguments:
  - "id": The ID of the goal for which details are requested.

  Expected context:
  - :person - The person requesting the goal details.
  """
  def get_goal_details do
    Function.new!(%{
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
        me = Map.get(context, :person)
        id = Map.get(args, "id")

        conn = %{
          assigns: %{
            current_person: me
          }
        }

        args = %{
          id: id
        }

        {:ok, goal} = OperatelyWeb.Api.Queries.GetGoal.call(conn, args)
        Jason.encode(goal)
      end
    })
  end

  @doc """
  Posts a message to a goal.

  Expects the following arguments:
  - "title": The title of the message.
  - "message": The markdown message to post to the goal.
  - "goal_id": The ID of the goal to which the message will be posted.

  Expected context:
  - :person - The person posting the message.
  """
  def post_goal_message do
    Function.new!(%{
      name: "post_goal_message",
      description: "Posts a message to the goal.",
      parameters_schema: %{
        type: "object",
        properties: %{
          goal_id: %{
            type: "string",
            description: "The ID of the goal to which the message will be posted."
          },
          title: %{
            type: "string",
            description: "The title of the message."
          },
          message: %{
            type: "string",
            description: "The markdown message to post to the goal."
          }
        },
        required: ["title", "message"]
      },
      function: fn args, context ->
        me = Map.get(context, :person)
        title = Map.get(args, "title")
        goal_id = Map.get(args, "goal_id")
        message = Map.get(args, "message") |> Operately.Demo.PoorMansMarkdown.from_markdown(%{}) |> Jason.encode!()

        conn = %{
          assigns: %{
            current_person: me
          }
        }

        args =
          %{
            goal_id: goal_id,
            title: title,
            message: message,
            send_notifications_to_everyone: true,
            subscriber_ids: []
          }

        {:ok, resp} = OperatelyWeb.Api.Mutations.CreateGoalDiscussion.call(conn, args)
        Jason.encode(resp)
      end
    })
  end
end
