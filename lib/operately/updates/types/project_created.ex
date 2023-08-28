defmodule Operately.Updates.Types.ProjectCreated do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :creator_id, Ecto.UUID
    field :champion_id, Ecto.UUID
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:champion_id, :creator_id])
  end

end
