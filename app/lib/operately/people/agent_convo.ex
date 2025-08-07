defmodule Operately.People.AgentConvo do
  use Operately.Schema
  import Ecto.Changeset

  schema "agent_convos" do
    field :request_id, :string

    belongs_to :goal, Operately.Goals.Goal, type: :binary_id
    belongs_to :author, Operately.People.Person, type: :binary_id

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_convo, attrs) do
    agent_convo
    |> cast(attrs, [
      :request_id,
      :author_id
    ])
    |> validate_required([:author_id])
    |> assoc_constraint(:author)
  end
end
