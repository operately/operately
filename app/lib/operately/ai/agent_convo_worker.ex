defmodule Operately.Ai.AgentConvoWorker do
  use Oban.Worker, queue: :default

  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.Utils.ChainResult

  alias Operately.Repo
  alias Operately.People.AgentMessage
  alias Operately.AI.Tools

  import Ecto.Query, only: [from: 2]

  def schedule_message_response(message) do
    new(%{message_id: message.id}) |> Oban.insert()
  end

  @impl Oban.Worker
  def perform(job) do
    with(
      message <- find_message(job.args["message_id"]),
      conversation <- find_conversation(message.convo_id),
      messages <- find_previous_messages(message),
      context <- build_context(conversation),
      chain <- create_chain(messages, context),
      {:ok, chain} <- run_chain(chain),
      {:ok, message} <- save_response(chain, message)
    ) do
      broadcast_new_message(message)

      {:ok, message}
    end
  end

  def find_message(id) do
    Repo.one(from m in AgentMessage, where: m.id == ^id)
  end

  def find_conversation(convo_id) do
    Repo.one(from c in Operately.People.AgentConvo, where: c.id == ^convo_id, preload: [:author])
  end

  def find_previous_messages(message) do
    from(m in AgentMessage, where: m.convo_id == ^message.convo_id and m.index < ^message.index, order_by: [asc: m.index]) |> Repo.all()
  end

  def create_chain(messages, context) do
    LLMChain.new!(%{llm: provider(), custom_context: context, verbose: true})
    |> LLMChain.add_tools(Tools.work_map())
    |> LLMChain.add_tools(Tools.get_goal_details())
    |> LLMChain.add_tools(Tools.get_project_details())
    |> inject_messages(messages)
  end

  def build_context(conversation) do
    %{
      person: conversation.author
    }
  end

  def save_response(chain, message) do
    resp = ChainResult.to_string!(chain)

    AgentMessage.changeset(message, %{message: resp, status: :done}) |> Repo.update()
  end

  def run_chain(chain) do
    LLMChain.run(chain, mode: :while_needs_response)
  end

  def broadcast_new_message(message) do
    OperatelyWeb.Api.Subscriptions.NewAgentMessage.broadcast(message.convo_id)
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
      :ai -> Message.new_assistant!(db_message.prompt)
    end
  end

  defp provider do
    case Application.get_env(:operately, :ai_provider) do
      "openai" ->
        model = Application.get_env(:operately, :openai_model)
        LangChain.ChatModels.ChatOpenAI.new!(%{model: model})

      "claude" ->
        LangChain.ChatModels.ChatAnthropic.new!()
    end
  end
end
