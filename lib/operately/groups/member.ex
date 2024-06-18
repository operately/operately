defmodule Operately.Groups.Member do
  use Operately.Schema

  schema "members" do
    belongs_to :group, Operately.Groups.Group
    belongs_to :person, Operately.People.Person

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(member, attrs) do
    member
    |> cast(attrs, [:group_id, :person_id])
    |> validate_required([:group_id, :person_id])
  end
end
