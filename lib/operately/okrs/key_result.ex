defmodule Operately.Okrs.KeyResult do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "key_results" do
    belongs_to :objective, Operately.Okrs.Objective

    field :name, :string
    field :target, :integer
    field :unit, Ecto.Enum, values: [:percentage, :number]
    field :direction, Ecto.Enum, values: [:above, :below]

    timestamps()
  end

  @doc false
  def changeset(key_result, attrs) do
    key_result
    |> cast(attrs, [:name, :unit, :target, :direction])
    |> validate_required([:name, :unit, :target, :direction])
  end
end
