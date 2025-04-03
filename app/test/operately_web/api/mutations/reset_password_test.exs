defmodule OperatelyWeb.Api.Mutations.ResetPasswordTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    Factory.setup(ctx)
    |> Factory.add_company_member(:member, email: "hello@local.test", password: "Aa12345#&!123")
    |> then(&create_reset_password_token/1)
  end

  test "password reset", ctx do
    assert {200, _} = mutation(ctx.conn, :reset_password, %{
      email: "hello@local.test",
      password: "new-password-123",
      password_confirmation: "new-password-123",
      reset_password_token: ctx.reset_password_token
    })

    account = Operately.People.get_account!(ctx.member.account_id)
    assert Operately.People.Account.valid_password?(account, "new-password-123")
  end

  describe "security" do
    test "it fails if the reset password token is invalid", ctx do
      assert {403, _} = mutation(ctx.conn, :reset_password, %{
        email: "hello@local.test",
        password: "new-password-123",
        password_confirmation: "new-password-123",
        reset_password_token: "invalid-token"
      })
    end

    test "it fails if password confirmation is invalid", ctx do
      assert {403, _} = mutation(ctx.conn, :reset_password, %{
        email: "hello@local.test",
        password: "new-password-123",
        password_confirmation: "not-the-same",
        reset_password_token: ctx.reset_password_token
      })
    end

    test "it fails if the email is invalid", ctx do
      assert {403, _} = mutation(ctx.conn, :reset_password, %{
        email: "other@email.test",
        password: "new-password-123",
        password_confirmation: "new-password-123",
        reset_password_token: ctx.reset_password_token
      })
    end
  end

  defp create_reset_password_token(ctx) do
    account = Operately.People.get_account!(ctx.member.account_id)
    {hashed, token} = Operately.People.AccountToken.build_email_token(account, "reset_password")
    {:ok, _} = Operately.Repo.insert(token)

    Map.put(ctx, :reset_password_token, hashed)
  end
end
