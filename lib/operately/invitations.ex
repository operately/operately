defmodule Operately.Invitations do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Invitations.Invitation


  def list_invitations do
    Repo.all(Invitation)
  end

  def get_invitation!(id), do: Repo.get!(Invitation, id)

  def create_invitation(attrs \\ %{}) do
    %Invitation{}
    |> Invitation.changeset(attrs)
    |> Repo.insert()
  end

  def update_invitation(%Invitation{} = invitation, attrs) do
    invitation
    |> Invitation.changeset(attrs)
    |> Repo.update()
  end

  def delete_invitation(%Invitation{} = invitation) do
    Repo.delete(invitation)
  end

  def change_invitation(%Invitation{} = invitation, attrs \\ %{}) do
    Invitation.changeset(invitation, attrs)
  end
end
