defmodule Operately.People.AgentConvo do
  use Operately.Schema
  import Ecto.Changeset

  alias Ecto.Multi
  alias Operately.People.AgentMessage

  import Ecto.Query, only: [from: 2]

  schema "agent_convos" do
    field :title, :string

    belongs_to :goal, Operately.Goals.Goal, type: :binary_id
    belongs_to :author, Operately.People.Person, type: :binary_id
    has_many :messages, Operately.People.AgentMessage, foreign_key: :convo_id, on_replace: :delete

    timestamps()
  end

  def user_facing_messages_query do
    from(m in AgentMessage, where: m.source != :system, order_by: [asc: m.index])
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_convo, attrs) do
    agent_convo
    |> cast(attrs, [:author_id, :title, :goal_id])
    |> validate_required([:author_id])
    |> assoc_constraint(:author)
  end

  def get(person, id: id) do
    from(
      c in __MODULE__,
      where: c.id == ^id and c.author_id == ^person.id,
      preload: [messages: ^user_facing_messages_query()]
    )
    |> Operately.Repo.one()
    |> case do
      nil -> {:error, :not_found}
      convo -> {:ok, convo}
    end
  end

  def list(person) do
    from(c in __MODULE__,
      where: c.author_id == ^person.id,
      preload: [messages: ^user_facing_messages_query()]
    )
    |> Operately.Repo.all()
  end

  def create(person, title, action_name, context_type, context_id) do
    case Operately.Ai.Prompts.find_action(context_type, action_name) do
      {:ok, action} -> create_goal_convo(person, title, action, context_id)
      _ -> {:error, "Invalid context_type #{inspect(context_type)}"}
    end
  end

  defp create_goal_convo(person, title, action, goal_id) do
    goal = Operately.Repo.get!(Operately.Goals.Goal, goal_id)
    goal_details = Operately.MD.Goal.render(goal)

    Multi.new()
    |> Multi.insert(:convo, fn _ ->
      %__MODULE__{}
      |> changeset(%{title: title, author_id: person.id, goal_id: goal_id})
    end)
    |> Multi.insert(:system_message, fn %{convo: convo} ->
      Operately.People.AgentMessage.changeset(%{
        index: 0,
        convo_id: convo.id,
        status: :done,
        source: :system,
        prompt: Operately.Ai.Prompts.system_prompt(),
        message: "system prompt"
      })
    end)
    |> Multi.insert(:initial_action, fn %{convo: convo} ->
      Operately.People.AgentMessage.changeset(%{
        index: 1,
        convo_id: convo.id,
        status: :done,
        source: :user,
        message: "Run action: '#{action.name}'",
        prompt: action.prompt <> "** Input goal: **\n\n#{goal_details}"
      })
    end)
    |> Multi.run(:schedule_response, fn _repo, %{convo: convo} ->
      Operately.Ai.AgentConvoWorker.new(%{convo_id: convo.id}) |> Oban.insert()
    end)
    |> Operately.Repo.transaction()
    |> Operately.Repo.extract_result(:convo)
  end
end
