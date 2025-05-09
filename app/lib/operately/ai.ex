defmodule Operately.AI do
  alias LangChain.Function
  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.ChatModels.ChatAnthropic
  alias LangChain.Utils.ChainResult
  alias Operately.WorkMaps.GetWorkMapQuery

  def run(person) do
    prompt = """
    You are a COO of a company. You are responsible for overseeing the company's
    operations and ensuring that everything runs smoothly. You have access to a
    work map that contains all the goals and projects of the company.

    How many active projects do we have in the company?
    """

    {:ok, updated_chain} =
      LLMChain.new!(%{llm: ChatAnthropic.new!(), verbose: true})
      |> LLMChain.add_tools(work_map_fn(person))
      |> LLMChain.add_message(Message.new_user!(prompt))
      |> LLMChain.run(mode: :while_needs_response)

    IO.puts(ChainResult.to_string!(updated_chain))
  end

  defp work_map_fn(person) do
    Function.new!(%{
      name: "get_work_map",
      description: "Returns all goals and projects for a given person.",
      function: fn _ ->
        {:ok, GetWorkMapQuery.execute(person, %{company_id: person.company_id})}
      end
    })
  end
end
