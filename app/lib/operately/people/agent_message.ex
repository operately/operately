defmodule Operately.People.AgentMessage do
  use Operately.Schema
  import Ecto.Changeset
  alias Ecto.Multi

  schema "agent_messages" do
    belongs_to :convo, Operately.People.AgentConvo

    field :source, Ecto.Enum, values: [:user, :ai, :system], default: :user
    field :status, Ecto.Enum, values: [:pending, :done], default: :pending
    field :message, :string
    field :prompt, :string
    field :index, :integer

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_message, attrs) do
    agent_message
    |> cast(attrs, [:status, :convo_id, :source, :message, :prompt, :index])
    |> validate_required([:status, :convo_id, :source, :index])
  end

  def create(convo, message) do
    Multi.new()
    |> Multi.insert(:message, fn _ ->
      Operately.People.AgentMessage.changeset(%{
        index: find_last_index(convo.id) + 1,
        convo_id: convo.id,
        status: :done,
        source: :user,
        prompt: message,
        message: message
      })
    end)
    |> Multi.run(:schedule_response, fn _repo, _ ->
      Operately.Ai.AgentConvoWorker.new(%{convo_id: convo.id}) |> Oban.insert()
    end)
    |> Operately.Repo.transaction()
    |> Operately.Repo.extract_result(:message)
    |> then(fn res ->
      OperatelyWeb.Api.Subscriptions.NewAgentMessage.broadcast(convo.id)
      res
    end)
  end

  defp find_last_index(convo_id) do
    import Ecto.Query, only: [from: 2]

    Operately.Repo.one(
      from m in Operately.People.AgentMessage,
        where: m.convo_id == ^convo_id,
        select: max(m.index)
    ) || 0
  end
end
