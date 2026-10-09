defmodule Operately.CuratedTemplates.Definitions.Milestone do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :key, :string
    field :title, :string
    field :due_offset_days, :integer
  end

  def changeset(schema, attrs, mode) do
    schema
    |> Definitions.cast_fields(attrs, [:key, :title, :due_offset_days], [:key, :title], mode)
    |> Ecto.Changeset.validate_required([:key])
    |> Definitions.nonnegative(:due_offset_days)
  end
end
