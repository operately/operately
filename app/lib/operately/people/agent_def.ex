defmodule Operately.People.AgentDef do
  use Operately.Schema
  import Ecto.Changeset

  schema "agent_defs" do
    field :definition, :string

    belongs_to :person, Operately.People.Person

    timestamps()
  end

  @doc false
  def changeset(agent_def, attrs) do
    agent_def
    |> cast(attrs, [:person_id, :definition])
    |> validate_required([:person_id, :definition])
    |> assoc_constraint(:person)
  end
end
