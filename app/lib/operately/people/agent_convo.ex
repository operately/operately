defmodule Operately.People.AgentConvo do
  use Operately.Schema
  import Ecto.Changeset

  schema "agent_convos" do
    field :title, :string

    belongs_to :goal, Operately.Goals.Goal, type: :binary_id
    belongs_to :author, Operately.People.Person, type: :binary_id
    has_many :messages, Operately.People.AgentMessage, foreign_key: :convo_id, on_replace: :delete

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_convo, attrs) do
    agent_convo
    |> cast(attrs, [:author_id, :title])
    |> validate_required([:author_id])
    |> assoc_constraint(:author)
  end

  def list(person) do
    import Ecto.Query, only: [from: 2]

    from(c in __MODULE__,
      where: c.author_id == ^person.id,
      preload: [:messages]
    )
    |> Operately.Repo.all()
  end

  def create(person, title, _context_type, context_id) do
    %__MODULE__{}
    |> changeset(%{
      title: title,
      author_id: person.id,
      goal_id: context_id
    })
    |> Operately.Repo.insert()
  end
end
