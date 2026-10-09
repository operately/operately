defmodule Operately.CuratedTemplates.Definitions.Kpi do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :name, :string
    field :description, :map
    field :unit, :string
    field :cadence, Ecto.Enum, values: [:weekly, :monthly]
  end

  def changeset(schema, attrs, mode) do
    schema
    |> Definitions.cast_fields(attrs, [:name, :description, :unit, :cadence], [:name, :unit, :cadence], mode)
    |> Definitions.description()
  end
end
