defmodule Operately.People.AgentMessage do
  use Operately.Schema
  import Ecto.Changeset
  alias Ecto.Multi

  schema "agent_messages" do
    belongs_to :convo, Operately.People.AgentConvo

    field :source, Ecto.Enum, values: [:user, :ai], default: :user
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
    biggest_index = find_last_index(convo.id)

    Multi.new()
    |> Multi.insert(:message, fn _ ->
      Operately.People.AgentMessage.changeset(%{
        index: biggest_index + 1,
        convo_id: convo.id,
        status: :done,
        source: :user,
        prompt: "",
        message: message
      })
    end)
    |> Multi.insert(:ai_resp, fn _ ->
      Operately.People.AgentMessage.changeset(%{
        index: biggest_index + 2,
        convo_id: convo.id,
        status: :pending,
        source: :ai,
        prompt: message,
        message: "Running..."
      })
    end)
    |> Multi.run(:schedule_response, fn _repo, %{ai_resp: ai_resp} ->
      Operately.Ai.AgentConvoWorker.new(%{message_id: ai_resp.id}) |> Oban.insert()
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
