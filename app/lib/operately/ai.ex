defmodule Operately.AI do
  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.ChatModels.ChatAnthropic
  alias LangChain.Utils.ChainResult
  alias Operately.AI.Tools

  def run(person, prompt) do
    {:ok, chain} =
      LLMChain.new!(%{
        llm: ChatAnthropic.new!(),
        custom_context: %{
          person: person
        }
      })
      |> LLMChain.add_tools(Tools.work_map())
      |> LLMChain.add_message(Message.new_user!(prompt))
      |> LLMChain.run(mode: :while_needs_response)

    ChainResult.to_string!(chain)
  end

  #
  # Goal Verification
  #

  def run_agent(run, definition, instructions) do
    provider =
      case run.agent_def.provider do
        :openai -> LangChain.ChatModels.ChatOpenAI.new!()
        :claude -> LangChain.ChatModels.ChatAnthropic.new!()
        _ -> raise "Unsupported provider: #{run.agent_def.provider}"
      end

    context = %{
      person: run.agent_def.person,
      agent_run: run
    }

    base =
      LLMChain.new!(%{llm: provider, custom_context: context})
      |> LLMChain.add_tools(Tools.add_agent_task())
      |> LLMChain.add_tools(Tools.work_map())
      |> LLMChain.add_tools(Tools.get_goal_details())
      |> LLMChain.add_tools(Tools.post_goal_message())
      |> LLMChain.add_message(Message.new_system!(definition))

    chain =
      Enum.reduce(instructions, base, fn instruction, acc ->
        LLMChain.add_message(acc, Message.new_user!(instruction))
      end)

    {:ok, chain} = LLMChain.run(chain, mode: :while_needs_response)
    ChainResult.to_string!(chain)
  end

  def start_new_goal_review(person, goal_id, convo_id) do
    IO.inspect("Running for #{inspect(person)}")
    IO.inspect("Starting new goal review for #{goal_id} with convo_id #{convo_id}")

    {:ok, nil}
  end
end
