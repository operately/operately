defmodule Operately.Invitations.Invitation do
  use Operately.Schema

  schema "invitations" do
    belongs_to :admin, Operately.People.Person
    belongs_to :member, Operately.People.Person

    has_one :invitation_token, Operately.Invitations.InvitationToken
    has_one :company, through: [:admin, :company]

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(invitation, attrs) do
    invitation
    |> cast(attrs, [:admin_id, :member_id])
    |> validate_required([:admin_id, :member_id])
  end
end
