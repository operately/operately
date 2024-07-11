defmodule OperatelyWeb.Api.Mutations.ChangePasswordFirstTimeTest do
  use OperatelyWeb.TurboCase

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

  describe "change_password_first_time functionality" do
    setup :register_and_log_in_account

    test "it fails if passwords don't match", ctx do
      payload = %{
        token: ctx.token,
        password: "Aa12345#&!123",
        password_confirmation: "123123123123123"
      }

      assert {400, res} = mutation(ctx.conn, :change_password_first_time, payload)
      assert res == %{error: "Bad request", message: "Passwords don't match"}
    end

    test "if fails if token is invalid", ctx do
      payload = %{
        token: "123123123123123",
        password: "Aa12345#&!123",
        password_confirmation: "Aa12345#&!123"
      }

      assert {400, res} = mutation(ctx.conn, :change_password_first_time, payload)
      assert res == %{error: "Bad request", message: "Invalid token"}
    end

    test "change password successfully", ctx do
      payload = %{
        token: ctx.token,
        password: "Aa12345#&!123",
        password_confirmation: "Aa12345#&!123"
      }

      assert {200, res} = mutation(ctx.conn, :change_password_first_time, payload)
      assert res.result == "Password successfully changed"
    end
  end
end 
