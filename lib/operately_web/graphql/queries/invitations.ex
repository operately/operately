defmodule OperatelyWeb.Graphql.Queries.Invitations do
  use Absinthe.Schema.Notation

  object :invitation_queries do
    field :invitator, non_null(:string) do
      arg :token, non_null(:string)

      resolve fn _, %{token: token}, _ ->
        invitation = Operately.Invitations.get_invitation_by_token(token)
        {:ok, invitation.admin_name}
      end
    end
  end
end
