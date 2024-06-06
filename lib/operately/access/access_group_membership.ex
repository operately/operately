defmodule Operately.Access.AccessGroupMembership do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "access_group_memberships" do
    belongs_to :access_group, Operately.Access.AccessGroup
    belongs_to :person, Operately.People.Person

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(access_group_membership, attrs) do
    access_group_membership
    |> cast(attrs, [:access_group_id, :person_id])
    |> validate_required([:access_group_id, :person_id])
  end
end
