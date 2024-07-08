defmodule OperatelyWeb.Api.Mutations.NewInvitationToken do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

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
          {:error, "This member didn't join the company using an invitation token."}

        invitation ->
          {:ok, invitation} = Operately.Operations.CompanyInvitationTokenCreation.run(admin, invitation)
          {:ok, %{invitation: OperatelyWeb.Api.Serializer.serialize(invitation)}}
      end
    else
      {:error, "Only admins can issue invitation tokens."}
    end
  end
end
