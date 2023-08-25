defmodule Operately.Updates.Types.Message do
  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    field :message, :map
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:message])
  end

end
