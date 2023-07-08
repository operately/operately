defmodule Operately.People.Pin do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "people_pins" do
    field :pinned_id, Ecto.UUID
    field :pinned_type, Ecto.Enum, values: [:project]
    field :person_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(pin, attrs) do
    pin
    |> cast(attrs, [:pinned_id, :pinned_type, :person_id])
    |> validate_required([:pinned_id, :pinned_type, :person_id])
  end
end
