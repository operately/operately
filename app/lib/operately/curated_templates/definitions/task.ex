defmodule Operately.CuratedTemplates.Definitions.Task do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :key, :string
    field :name, :string
    field :description, :map
    field :milestone_key, :string
    field :due_offset_days, :integer
  end

  def changeset(schema, attrs, mode) do
    schema
    |> Definitions.cast_fields(attrs, [:key, :name, :description, :milestone_key, :due_offset_days], [:key, :name], mode)
    |> Definitions.description()
    |> Ecto.Changeset.validate_required([:key])
    |> Definitions.nonnegative(:due_offset_days)
  end
end
