defmodule Operately.AI do
  alias LangChain.Function
  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.ChatModels.ChatAnthropic
  alias LangChain.Utils.ChainResult
  alias Operately.WorkMaps.GetWorkMapQuery

  def coo_prompt(question) do
    """
    Act as a Chief Operating Officer (COO) of a company. You are responsible for
    overseeing the company's operations and ensuring that everything runs
    smoothly. You have access to a work map that contains all the goals and
    projects of the company.

    #{question}
    """
  end

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
        {:ok, inspect(workmap)}
      end
    })
  end
end
