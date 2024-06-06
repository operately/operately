defmodule Operately.Invitations do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Invitations.Invitation
  alias Operately.Invitations.InvitationToken


  def list_invitations do
    Repo.all(Invitation)
  end

  def get_invitation!(id), do: Repo.get!(Invitation, id)

  def get_invitation_by_token(token) do
    hashed_token = InvitationToken.hash_token(token)
    now = DateTime.utc_now()

    query = from t in InvitationToken,
      where: t.hashed_token == ^hashed_token,
      preload: [:invitation],
      select: t

    case Repo.one(query) do
      nil ->
        nil
      token ->
        if InvitationToken.valid_token_time?(token, now) do
          token.invitation
        else
          nil
        end
    end
  end

  def get_invitation_by_member(member_id) when is_binary(member_id) do
    query = from i in Operately.Invitations.Invitation,
      where: i.member_id == ^member_id,
      preload: [:member],
      select: i

    Repo.one(query)
  end

  def get_invitation_by_member(%Operately.People.Person{id: member_id}) do
    get_invitation_by_member(member_id)
  end

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


  def list_invitation_tokens do
    Repo.all(InvitationToken)
  end

  def get_invitation_token!(id), do: Repo.get!(InvitationToken, id)

  def get_invitation_token_by_invitation(invitation_id) do
    Repo.get_by(InvitationToken, invitation_id: invitation_id)
  end

  def create_invitation_token!(attrs, opts \\ []) do
    Repo.transaction(fn ->
      invitation_id = attrs[:invitation_id]

      existing_token = Repo.get_by(InvitationToken, invitation_id: invitation_id)

      case existing_token do
        nil -> :ok
        %InvitationToken{} = token -> Repo.delete!(token)
      end

      %InvitationToken{}
      |> InvitationToken.changeset(attrs, opts)
      |> Repo.insert!()
    end)
  end

  def delete_invitation_token(%InvitationToken{} = invitation_token) do
    Repo.delete(invitation_token)
  end
end
