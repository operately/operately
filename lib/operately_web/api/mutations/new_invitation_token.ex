defmodule OperatelyWeb.Api.Mutations.NewInvitationToken do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :person_id, :string
  end

  outputs do
    field :invitation, :invitation
  end

  def call(conn, inputs) do
    admin = me(conn)
    allowed = admin.company_role == :admin

    if allowed do
      {:ok, id} = decode_id(inputs.person_id)

      case Operately.Invitations.get_invitation_by_member(id) do
        nil -> 
          {:error, :bad_request, "This member didn't join the company using an invitation token."}

        invitation ->
          invitation = create_token(admin, invitation)

          {:ok, %{invitation: OperatelyWeb.Api.Serializer.serialize(invitation, level: :full)}}
      end
    else
      {:error, :bad_request, "Only admins can issue invitation tokens."}
    end
  end

  defp create_token(admin, invitation) do
    {:ok, _} = Operately.Operations.CompanyInvitationTokenCreation.run(admin, invitation)

    value = Operately.Invitations.InvitationToken.build_token()

    {:ok, token} = Operately.Invitations.create_invitation_token!(%{
      token: value,
      invitation_id: invitation.id,
    })

    invitation = Repo.one(
      from i in Operately.Invitations.Invitation,
        where: i.id == ^invitation.id,
        preload: [:member, :invitation_token, :admin]
    )

    token = %{token | token: value}
    %{invitation | invitation_token: token}
  end
end
