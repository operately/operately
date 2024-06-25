defmodule Operately.Access.GroupMembership do
  use Operately.Schema

  schema "access_group_memberships" do
    belongs_to :access_group, Operately.Access.Group
    belongs_to :person, Operately.People.Person

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group_membership, attrs) do
    group_membership
    |> cast(attrs, [:access_group_id, :person_id])
    |> validate_required([:access_group_id, :person_id])
  end
end
