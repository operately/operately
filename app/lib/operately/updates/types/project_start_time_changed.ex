defmodule Operately.Updates.Types.ProjectStartTimeChanged do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :old_start_time, :utc_datetime
    field :new_start_time, :utc_datetime
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end
end
