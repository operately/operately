defmodule Operately.People.AgentDef do
  use Operately.Schema
  import Ecto.Changeset

  schema "agent_defs" do
    belongs_to :person, Operately.People.Person
    has_many :agent_runs, Operately.People.AgentRun

    field :sandbox_mode, :boolean, default: false
    field :definition, :string
    field :planning_instructions, :string
    field :task_execution_instructions, :string
    field :daily_run, :boolean, default: false
    field :verbose_logs, :boolean, default: false
    field :provider, Ecto.Enum, values: [:openai, :claude], default: :claude

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_def, attrs) do
    agent_def
    |> cast(attrs, [
      :person_id,
      :definition,
      :sandbox_mode,
      :planning_instructions,
      :task_execution_instructions,
      :daily_run,
      :verbose_logs,
      :provider
    ])
    |> validate_required([:person_id])
    |> assoc_constraint(:person)
  end
end
