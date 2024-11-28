defmodule OperatelyWeb.Api.Mutations.ChangePasswordTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    Factory.setup(ctx)
    |> Factory.add_company_member(:member, email: "hello@local.test", password: "Aa12345#&!123")
  end

  test "if changes the password", ctx do
    ctx = ctx |> Factory.log_in_person(:member)
  
    assert {200, _} = mutation(ctx.conn, :change_password, %{
      current_password: "Aa12345#&!123",
      new_password: "new-password-123",
      new_password_confirmation: "new-password-123"
    })

    account = Operately.People.get_account!(ctx.member.account_id)
    assert Operately.People.Account.valid_password?(account, "new-password-123")
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :change_password, %{})
    end

    test "it requires a valid current password", ctx do
      ctx = ctx |> Factory.log_in_person(:member)
    
      assert {403, _} = mutation(ctx.conn, :change_password, %{
        current_password: "invalid-password",
        new_password: "new-password-123",
        new_password_confirmation: "new-password-123"
      })
    end

    test "it requires a valid password confirmation", ctx do
      ctx = ctx |> Factory.log_in_person(:member)
    
      assert {403, _} = mutation(ctx.conn, :change_password, %{
        current_password: "Aa12345#&!123",
        new_password: "new-password-123",
        new_password_confirmation: "invalid-confirmation"
      })
    end
  end
end
