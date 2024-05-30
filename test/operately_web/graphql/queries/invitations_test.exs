defmodule OperatelyWeb.Graphql.Queries.InvitationsTest do
  use OperatelyWeb.ConnCase

  import Operately.InvitationsFixtures

  alias Operately.Invitations
  alias Operately.Invitations.InvitationToken

  @get_invitator """
  query GetInvitator($token: String!) {
    invitator(token: $token)
  }
  """

  test "query: invitator", ctx do
    invitation = invitation_fixture()
    token = InvitationToken.build_token()

    Invitations.create_invitation_token!(%{
      invitation_id: invitation.id,
      token: token,
    })

    conn = graphql(ctx.conn, @get_invitator, "GetInvitator", %{
      "token" => token,
    })
    res = json_response(conn, 200)

    assert res["data"]["invitator"] == invitation.admin_name
  end

  defp graphql(conn, query, operation_name, variables) do
    payload = %{
      operationName: operation_name,
      query: query,
      variables: variables,
    }

    conn |> post("/api/gql", payload)
  end
end
