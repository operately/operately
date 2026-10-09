defmodule Operately.CuratedTemplates.Definitions.Target do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :name, :string
    field :unit, :string
    field :from, :float
    field :to, :float
  end

  def changeset(schema, attrs, mode) do
    schema
    |> Definitions.cast_fields(attrs, [:name, :unit, :from, :to], [:name, :unit, :from, :to], mode)
  end
end
