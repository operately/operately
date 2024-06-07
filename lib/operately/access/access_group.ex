defmodule Operately.Access.AccessGroup do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "access_groups" do

    timestamps()
  end

  def changeset(access_group, attrs) do
    access_group
    |> cast(attrs, [])
    |> validate_required([])
  end
end
