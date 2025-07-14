defmodule Operately.People.AgentDef do
  use Operately.Schema
  import Ecto.Changeset

  schema "agent_defs" do
    belongs_to :person, Operately.People.Person
    has_many :agent_runs, Operately.People.AgentRun

    field :definition, :string
    field :sandbox_mode, :boolean, default: false

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_def, attrs) do
    agent_def
    |> cast(attrs, [:person_id, :definition, :sandbox_mode])
    |> validate_required([:person_id])
    |> assoc_constraint(:person)
  end
end
