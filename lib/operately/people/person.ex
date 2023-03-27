defmodule Operately.People.Person do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @derive {Jason.Encoder, only: [:id, :full_name , :inserted_at, :handle, :title]}
  schema "people" do
    field :full_name, :string
    field :handle, :string
    field :title, :string

    timestamps()
  end

  @doc false
  def changeset(person, attrs) do
    person
    |> cast(attrs, [:full_name, :handle, :title])
    |> validate_required([:full_name, :handle, :title])
    |> unique_constraint(:handle)
  end
end
