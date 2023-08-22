defmodule Operately.Updates.Types.StatusUpdate do
  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    field :message, :map
    field :old_health, :string
    field :new_health, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:message, :old_health, :new_health])
  end

end
