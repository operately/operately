defmodule OperatelyWeb.Api.Mutations.AddCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :full_name, :string
    field :email, :string
    field :title, :string
  end

  outputs do
    field :invitation, :invitation
  end

  def call(conn, inputs) do
    person = me(conn)
    allowed = person.company_role == :admin

    if allowed do
      invitation = create_invitation(person, inputs)

      {:ok, %{invitation: OperatelyWeb.Api.Serializer.serialize(invitation, level: :full)}}
    else
      {:error, :bad_request, "Only admins can add members"}
    end
  end

  defp create_invitation(person, inputs) do
    {:ok, invitation} = Operately.Operations.CompanyMemberAdding.run(person, inputs)

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

    # the token is a virtual field, so we need to update the struct after reaload
    token = %{token | token: value}
    %{invitation | invitation_token: token}
  end
end
