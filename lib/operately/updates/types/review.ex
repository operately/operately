defmodule Operately.Updates.Types.Review do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :message, :map

    field :previous_phase, :string
    field :new_phase, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:message, :previous_phase, :new_phase])
  end

  def build(message, previous_phase, new_phase) do
    %{
      :message => message,
      :previous_phase => previous_phase,
      :new_phase => new_phase,
    }
  end
end
