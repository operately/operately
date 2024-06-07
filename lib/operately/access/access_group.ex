defmodule Operately.Access.Group do
  use Operately.Schema

  schema "access_groups" do

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group, attrs) do
    group
    |> cast(attrs, [])
    |> validate_required([])
  end
end
