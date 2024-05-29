defmodule Operately.Invitations.Invitation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "invitations" do
    belongs_to :admin, Operately.People.Account
    belongs_to :member, Operately.People.Account

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
