defmodule Operately.Invitations.Invitation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "invitations" do
    belongs_to :admin, Operately.People.Person
    belongs_to :member, Operately.People.Person
    has_one :invitation_token, Operately.Invitations.InvitationToken

    field :admin_name, :string

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(invitation, attrs) do
    invitation
    |> cast(attrs, [:admin_id, :member_id, :admin_name])
    |> validate_required([:admin_id, :member_id, :admin_name])
  end
end
