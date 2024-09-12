defmodule Operately.Goals.Update.Target do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false

  embedded_schema do
    field :id, :string
    field :name, :string
    field :value, :float
    field :unit, :string
    field :previous_value, :float
    field :index, :integer
    field :from, :float
    field :to, :float
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end
end
