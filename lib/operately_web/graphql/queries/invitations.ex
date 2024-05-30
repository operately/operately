defmodule OperatelyWeb.Graphql.Queries.Invitations do
  use Absinthe.Schema.Notation

  object :invitation_queries do
    field :invitation, non_null(:invitation) do
      arg :token, non_null(:string)

      resolve fn _, %{token: token}, _ ->
        {:ok, Operately.Invitations.get_invitation_by_token(token)}
      end
    end
  end
end
