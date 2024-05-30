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


  alias Operately.Invitations.InvitationToken

  def list_invitation_tokens do
    Repo.all(InvitationToken)
  end

  def get_invitation_token!(id), do: Repo.get!(InvitationToken, id)

  def get_invitation_token_by_invitation(invitation_id) do
    Repo.get_by(InvitationToken, invitation_id: invitation_id)
  end

  def create_invitation_token!(attrs) do
    Repo.transaction(fn ->
      invitation_id = attrs[:invitation_id]

      existing_token = Repo.get_by(InvitationToken, invitation_id: invitation_id)

      case existing_token do
        nil -> :ok
        %InvitationToken{} = token -> Repo.delete!(token)
      end

      %InvitationToken{}
      |> InvitationToken.changeset(attrs)
      |> Repo.insert!()
    end)
  end

  def delete_invitation_token(%InvitationToken{} = invitation_token) do
    Repo.delete(invitation_token)
  end
end
