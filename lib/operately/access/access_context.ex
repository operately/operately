defmodule Operately.Access.Context do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "access_contexts" do

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(context, attrs) do
    context
    |> cast(attrs, [])
    |> validate_required([])
  end
end
