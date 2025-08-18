defmodule Operately.Ai.AgentConvoWorker do
  use Oban.Worker, queue: :default

  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.Utils.ChainResult

  @impl Oban.Worker
  def perform(job) do
    with(
      convo <- Operately.Repo.get!(Operately.People.AgentConvo, job.args["convo_id"], preload: [:messages]),
      chain <- create_chain(convo),
      {:ok, chain} <- run_chain(chain),
      {:ok, message} <- save_response(convo, chain)
    ) do
      broadcast_new_message(convo)

      {:ok, message}
    end
  end

  def create_chain(convo) do
    provider = LangChain.ChatModels.ChatAnthropic.new!()

    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect("AAAAA")
    IO.inspect(convo.messages)

    LLMChain.new!(%{llm: provider, custom_context: %{}})
    |> inject_messages(convo.messages)
  end

  def save_response(convo, chain) do
    Operately.People.AgentMessage.changeset(%{
      index: convo.messages |> Enum.count(),
      status: :done,
      message: ChainResult.to_string!(chain)
    })
    |> Operately.Repo.insert()
  end

  def run_chain(chain) do
    LLMChain.run(chain, mode: :while_needs_response)
  end

  def broadcast_new_message(convo) do
    OperatelyWeb.Api.Subscriptions.NewAgentMessage.broadcast(convo.id)
  end

  def inject_messages(chain, messages) do
    Enum.reduce(messages, chain, fn db_message, acc_chain ->
      message = db_message_to_llm_chain_message(db_message)
      LLMChain.add_message(acc_chain, message)
    end)
  end

  def db_message_to_llm_chain_message(db_message) do
    case db_message.sender do
      :system -> Message.new_system!(db_message.prompt)
      :user -> Message.new_user!(db_message.prompt)
      :ai -> Message.new_assistant!(db_message.message)
    end
  end
end
