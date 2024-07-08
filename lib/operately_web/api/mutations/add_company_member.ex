defmodule OperatelyWeb.Api.Mutations.AddCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :full_name, :string
    field :email, :string
    field :role, :string
  end

  outputs do
    field :invitation, :invitation
  end

  def call(conn, inputs) do
    person = me(conn)
    allowed = person.company_role == :admin

    if allowed do
      {:ok, invitation} = Operately.Operations.CompanyMemberAdding.run(person, inputs)

      value = Operately.Invitations.InvitationToken.build_token()

      {:ok, _} = Operately.Invitations.create_invitation_token!(%{
        token: value,
        invitation_id: invitation.id,
      })

      invitation = Repo.one(
        from i in Operately.Invitations.Invitation,
        where: i.id == ^invitation.id,
        preload: [:company, :person, :token]
      )

      {:ok, %{invitation: OperatelyWeb.Api.Serializer.serialize(invitation, :full)}}
    else
      {:error, "Only admins can add members"}
    end
  end
end
