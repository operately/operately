defmodule Operately.AI.Tools do
  @moduledoc """
  Provides AI tools for interacting with Operately's API.
  """

  alias LangChain.Function
  alias Operately.WorkMaps.GetWorkMapQuery

  @doc """
  Returns a tool that retrieves the work map for a given person.

  Expected context:
  - :person - The person for whom the work map is requested.
  """
  def work_map do
    Function.new!(%{
      name: "get_work_map",
      description: "Returns all goals and projects for a given person.",
      function: fn _, context ->
        log(context, "work_map used")
        person = Map.get(context, :person)

        {:ok, workmap} = GetWorkMapQuery.execute(person, %{company_id: person.company_id})
        api_serialized = OperatelyWeb.Api.Serializer.serialize(workmap, level: :full)

        Jason.encode(api_serialized)
      end
    })
  end

  @doc """
  Provides details of a goal.

  Expects the following arguments:
  - "id": The ID of the goal for which details are requested.

  Expected context:
  - :person - The person requesting the goal details.
  - :agent_run_id - The ID of the agent run.
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
        log(context, "get_goal_details used with: #{inspect(args)}")

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
        log(context, "post_goal_message used with: #{inspect(args)}")

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

  defp log(context, msg) do
    if Map.has_key?(context, :agent_run_id) do
      Operately.People.AgentRun.append_log(context.agent_run.id, msg)
    end
  end
end
