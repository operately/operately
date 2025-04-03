defmodule Operately.Updates.Types.ProjectEndTimeChanged do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :old_end_time, :utc_datetime
    field :new_end_time, :utc_datetime
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end
end
