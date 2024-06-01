defmodule OperatelyWeb.Graphql.Queries.InvitationsTest do
  use OperatelyWeb.ConnCase

  import Operately.InvitationsFixtures

  @get_invitator """
  query GetInvitation($token: String!) {
    invitation(token: $token) {
      id
      admin {
        full_name
      }
      member {
        email
      }
    }
  }
  """

  test "query: invitation", ctx do
    invitation = invitation_fixture()
      |> Operately.Repo.preload([:admin, :member])
    token = invitation_token_fixture_unhashed(invitation.id)

    conn = graphql(ctx.conn, @get_invitator, "GetInvitation", %{
      "token" => token,
    })
    res = json_response(conn, 200)

    assert res["data"]["invitation"]["admin"]["full_name"] == invitation.admin.full_name
    assert res["data"]["invitation"]["member"]["email"] == invitation.member.email
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
