defmodule Operately.Alignments.Alignment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "alignments" do
    field :child, Ecto.UUID
    field :child_type, Ecto.Enum, values: [:objective]
    field :parent, Ecto.UUID
    field :parent_type, Ecto.Enum, values: [:objective]

    timestamps()
  end

  @doc false
  def changeset(alignment, attrs) do
    alignment
    |> cast(attrs, [:parent, :parent_type, :child, :child_type])
    |> validate_required([:parent, :parent_type, :child, :child_type])
  end
end
