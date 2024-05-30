defmodule OperatelyWeb.Graphql.Types.Invitations do
  use Absinthe.Schema.Notation

  object :invitation do
    field :id, non_null(:id)
    field :admin_name, non_null(:string)

    # Retrieving an invitation token always creates a new token
    # create_invitation_token!/1 ensures that the previous token is deleted
    field :token, non_null(:string) do
      resolve fn invitation, _, _ ->
        token = Operately.Invitations.InvitationToken.build_token()

        Operately.Invitations.create_invitation_token!(%{
          token: token,
          invitation_id: invitation.id,
        })

        {:ok, token}
      end
    end
  end
end
