defmodule Operately.Access.GroupMembership do
  use Operately.Schema

  schema "access_group_memberships" do
    belongs_to :group, Operately.Access.Group
    belongs_to :person, Operately.People.Person

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group_membership, attrs) do
    group_membership
    |> cast(attrs, [:group_id, :person_id])
    |> validate_required([:group_id, :person_id])
  end
end
