defmodule Operately.Ownerships.Ownership do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "ownerships" do
    belongs_to :person, Operately.People.Person

    field :target, Ecto.UUID
    field :target_type, Ecto.Enum, values: [:objective, :tenet, :project]

    timestamps()
  end

  @doc false
  def changeset(ownership, attrs) do
    ownership
    |> cast(attrs, [:target_type, :person_id])
  end
end
