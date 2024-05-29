defmodule OperatelyWeb.Graphql.Types.Invitations do
  use Absinthe.Schema.Notation

  object :invitation do
    field :id, non_null(:id)
    field :admin_name, non_null(:string)

    field :token, non_null(:string) do
      resolve fn invitation, _, _ ->
        token = Operately.Invitations.get_invitation_token_by_invitation(invitation.id)
        {:ok, token.hashed_token}
      end
    end
  end
end
