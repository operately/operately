defmodule Operately.Updates.Types.ProjectMilestoneCompleted do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :milestone_id, Ecto.UUID
    field :milestone_title, :string
    field :milestone_deadline, :utc_datetime
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

end
