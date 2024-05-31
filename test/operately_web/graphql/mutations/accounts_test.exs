defmodule OperatelyWeb.Graphql.Mutations.AccountsTest do
  use OperatelyWeb.ConnCase
  import Operately.InvitationsFixtures

  setup ctx do
    invitation = invitation_fixture()
    token = Operately.Invitations.InvitationToken.build_token()

    Operately.Invitations.create_invitation_token!(%{
      invitation_id: invitation.id,
      token: token,
    })

    Map.put(ctx, :token, token)
  end

  @change_password_first_time """
  mutation ChangePasswordFirstTime($input: ChangePasswordInput!) {
    changePasswordFirstTime(input: $input)
  }
  """

  describe "mutation: ChangePasswordFirstTime" do
    test "different passwords fail", ctx do
      payload = %{
        :input => %{
          :token => ctx.token,
          :password => "Aa12345#&!123",
          :passwordConfirmation => "123123123123123"
        }
      }

      conn = graphql(ctx.conn, @change_password_first_time, "ChangePasswordFirstTime", payload)
      res = json_response(conn, 200)

      assert res["data"]["changePasswordFirstTime"] == nil
      assert res["errors"] |> List.first() |> Map.get("message") == "Passwords don't match"
    end

    test "invalid token", ctx do
      payload = %{
        :input => %{
          :token => "123123123123123",
          :password => "Aa12345#&!123",
          :passwordConfirmation => "Aa12345#&!123"
        }
      }

      conn = graphql(ctx.conn, @change_password_first_time, "ChangePasswordFirstTime", payload)
      res = json_response(conn, 200)

      assert res["data"]["changePasswordFirstTime"] == nil
      assert res["errors"] |> List.first() |> Map.get("message") == "Invalid token"
    end
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
