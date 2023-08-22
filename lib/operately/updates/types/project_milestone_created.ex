defmodule Operately.Updates.Types.ProjectMilestoneCreated do
  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    field :milestone_id, Ecto.UUID
    field :milestone_title, :string
    field :milestone_deadline, :utc_datetime
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:milestone_id, :milestone_title, :milestone_deadline])
  end

end
