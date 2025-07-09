defmodule Operately.AI do
  alias LangChain.Function
  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.ChatModels.ChatAnthropic
  alias LangChain.Utils.ChainResult
  alias Operately.WorkMaps.GetWorkMapQuery

  def run(person, prompt) do
    {:ok, chain} =
      LLMChain.new!(%{llm: ChatAnthropic.new!(), custom_context: %{}})
      |> LLMChain.add_tools(work_map_fn(person))
      |> LLMChain.add_message(Message.new_user!(prompt))
      |> LLMChain.run(mode: :while_needs_response)

    ChainResult.to_string!(chain)
  end

  defp work_map_fn(person) do
    Function.new!(%{
      name: "get_work_map",
      description: "Returns all goals and projects for a given person.",
      function: fn _, _ ->
        {:ok, workmap} = GetWorkMapQuery.execute(person, %{company_id: person.company_id})
        api_serialized = OperatelyWeb.Api.Serializer.serialize(workmap, level: :full)

        Jason.encode(api_serialized)
      end
    })
  end

  #
  # Goal Verification
  #

  def verify_goal(person, goal) do
    prompt = """
    You are a COO of the company. Your task is to verify if the goal is well defined and actionable.
    Please review the goal and if it is not well defined, provide a detailed explanation of what is missing or needs
    to be changed. The feedback should be actionable and specific. Submit the feedback as a markdown message
    to the goal.
    """

    {:ok, chain} =
      LLMChain.new!(%{
        llm: ChatAnthropic.new!(),
        custom_context: %{
          person: person,
          goal: goal
        }
      })
      |> LLMChain.add_tools(get_goal_details_fn())
      |> LLMChain.add_tools(post_goal_message_fn())
      |> LLMChain.add_message(Message.new_user!(prompt))
      |> LLMChain.run(mode: :while_needs_response)

    ChainResult.to_string!(chain)
  end

  defp get_goal_details_fn do
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

        OperatelyWeb.Api.Queries.GetGoal.run(conn, %{id: goal.id})
        |> IO.inspect(label: "Goal Details")
      end
    })
  end

  defp post_goal_message_fn(person) do
    Function.new!(%{
      name: "post_goal_message",
      description: "Posts a message to the goal.",
      parameters_schema: %{
        type: "object",
        properties: %{
          message: %{
            type: "string",
            description: "The markdown message to post to the goal."
          }
        },
        required: ["message"]
      },
      function: fn args, context ->
        content = Map.get(args, "content")
        goal = Map.get(context, :goal)

        conn = %{
          assigns: %{
            current_person: me
          }
        }

        Operately.Goals.post_goal_message(person, goal_id, message)
      end
    })
  end
end
