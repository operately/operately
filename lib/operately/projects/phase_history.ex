defmodule Operately.Projects.PhaseHistory do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_phase_history" do
    belongs_to :project, Operately.Projects.Project

    field :phase, Ecto.Enum, values: [:planning, :execution, :control, :canceled, :completed, :paused]

    field :start_time, :utc_datetime
    field :end_time, :utc_datetime
    field :due_time, :utc_datetime

    timestamps()
  end

  @doc false
  def changeset(phase_history, attrs) do
    phase_history
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:phase, :project_id])
  end
end
