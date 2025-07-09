defmodule Operately.AI.Tools do
  alias LangChain.Function

  @moduledoc """
  Provides AI tools for interacting with Operately's API.
  """

  @doc """
  Provides details of a goal.

  Expected context:
  - :person - The person requesting the goal details.
  - :goal - The goal for which details are requested.
  """
  def get_goal_details do
    Function.new!(%{
      name: "get_goal_details",
      description: "Returns the details of the goal.",
      function: fn _, context ->
        me = Map.get(context, :person)
        goal = Map.get(context, :goal)

        conn = %{
          assigns: %{
            current_person: me
          }
        }

        args = %{
          id: goal.id
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

  Expected context:
  - :person - The person posting the message.
  - :goal - The goal to which the message will be posted.
  """
  def post_goal_message do
    Function.new!(%{
      name: "post_goal_message",
      description: "Posts a message to the goal.",
      parameters_schema: %{
        type: "object",
        properties: %{
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
        content = Map.get(args, "content")
        goal = Map.get(context, :goal)
        me = Map.get(context, :person)
        title = Map.get(args, "title")
        message = Operately.Demo.PoorMansMarkdown.from_markdown(content, %{})

        conn = %{
          assigns: %{
            current_person: me
          }
        }

        args = %{
          goal_id: goal.id,
          title: title,
          message: message,
          send_notifications_to_everyone: true,
          subscriber_ids: []
        }

        OperatelyWeb.Api.Mutations.CreateGoalDiscussion.call(conn, args)
        |> IO.inspect(label: "Posting a message")
      end
    })
  end
end
