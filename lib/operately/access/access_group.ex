defmodule Operately.Access.Group do
  use Operately.Schema

  schema "access_groups" do
    belongs_to :person, Operately.Groups.Group, foreign_key: :person_id

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group, attrs) do
    group
    |> cast(attrs, [:person_id])
    |> validate_required([])
  end
end
