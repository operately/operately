defmodule Operately.Ai.AgentConvoWorker do
  use Oban.Worker, queue: :default

  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.Utils.ChainResult

  @impl Oban.Worker
  def perform(job) do
    with(
      convo <- find_convo(job.args["convo_id"]),
      chain <- create_chain(convo),
      {:ok, chain} <- run_chain(chain),
      {:ok, message} <- save_response(convo, chain)
    ) do
      broadcast_new_message(convo)

      {:ok, message}
    end
  end

  def find_convo(id) do
    import Ecto.Query, only: [from: 2]
    Operately.Repo.one(from c in Operately.People.AgentConvo, where: c.id == ^id, preload: [:messages])
  end

  def create_chain(convo) do
    provider = LangChain.ChatModels.ChatAnthropic.new!()

    LLMChain.new!(%{llm: provider, custom_context: %{}})
    |> inject_messages(convo.messages)
  end

  def save_response(convo, chain) do
    Operately.People.AgentMessage.changeset(%{
      convo_id: convo.id,
      index: convo.messages |> Enum.count(),
      status: :done,
      source: :ai,
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
    case db_message.source do
      :system -> Message.new_system!(db_message.prompt)
      :user -> Message.new_user!(db_message.prompt)
      :ai -> Message.new_assistant!(db_message.message)
    end
  end
end
