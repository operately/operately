defmodule Operately.People.AgentConvo do
  use Operately.Schema
  import Ecto.Changeset

  import Ecto.Query, only: [from: 2]

  schema "agent_convos" do
    field :title, :string

    belongs_to :goal, Operately.Goals.Goal, type: :binary_id
    belongs_to :project, Operately.Projects.Project, type: :binary_id

    belongs_to :author, Operately.People.Person, type: :binary_id
    has_many :messages, Operately.People.AgentMessage, foreign_key: :convo_id, on_replace: :delete

    timestamps()
  end

  def user_facing_messages_query do
    from(m in AgentMessage, where: m.source != :system, order_by: [asc: m.index])
  end

  def preload_user_facing_messages(convo) do
    Operately.Repo.preload(convo, messages: user_facing_messages_query())
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

  def create(person, action_name, context_type, context_id) do
    __MODULE__.Create.run(person, action_name, context_type, context_id)
  end
end
