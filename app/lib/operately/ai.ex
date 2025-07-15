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

  def run_agent(run, prompt) do
    run = Operately.Repo.preload(run, agent_def: :person)
    definition = run.agent_def.definition

    {:ok, chain} =
      LLMChain.new!(%{
        llm: ChatAnthropic.new!(),
        custom_context: %{
          person: run.agent_def.person,
          agent_run: run
        }
      })
      |> LLMChain.add_tools(Tools.add_agent_task())
      |> LLMChain.add_tools(Tools.work_map())
      |> LLMChain.add_tools(Tools.get_goal_details())
      |> LLMChain.add_tools(Tools.post_goal_message())
      |> LLMChain.add_message(Message.new_system!(definition))
      |> LLMChain.add_message(Message.new_user!(prompt))
      |> LLMChain.run(mode: :while_needs_response)

    ChainResult.to_string!(chain)
  end
end
