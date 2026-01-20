defmodule OperatelyWeb.Api.Mutations.JoinCompanyText do
  use OperatelyWeb.TurboCase

  import Operately.InviteLinksFixtures

  alias Operately.People
  alias Operately.People.Account
  alias Operately.Repo

  setup ctx do
    invite_link = personal_invite_link_fixture()
    token = invite_link.token

    Map.merge(ctx, %{token: token, invite_link: invite_link})
  end

  describe "join_company functionality" do
    setup :register_and_log_in_account

    test "it fails if passwords don't match", ctx do
      payload = %{
        token: ctx.token,
        password: "Aa12345#&!123",
        password_confirmation: "123123123123123"
      }

      assert {400, res} = mutation(ctx.conn, :join_company, payload)
      assert res == %{error: "Bad request", message: "Passwords don't match"}
    end

    test "if fails if token is invalid", ctx do
      payload = %{
        token: "123123123123123",
        password: "Aa12345#&!123",
        password_confirmation: "Aa12345#&!123"
      }

      assert {400, res} = mutation(ctx.conn, :join_company, payload)
      assert res == %{error: "Bad request", message: "Invalid token"}
    end

    test "change password successfully", ctx do
      payload = %{
        token: ctx.token,
        password: "Aa12345#&!123",
        password_confirmation: "Aa12345#&!123"
      }

      assert {200, res} = mutation(ctx.conn, :join_company, payload)
      assert res.result == "Password successfully changed"
    end

    test "succeeds when account already logged in and keeps first_login_at", ctx do
      person = People.get_person!(ctx.invite_link.person_id) |> Repo.preload(:account)
      {:ok, account} = People.mark_account_first_login(person.account)
      first_login_at = account.first_login_at

      payload = %{
        token: ctx.token,
        password: "Aa12345#&!123",
        password_confirmation: "Aa12345#&!123"
      }

      assert {200, res} = mutation(ctx.conn, :join_company, payload)
      assert res.result == "Password successfully changed"

      account = Repo.get!(Account, account.id)
      assert account.first_login_at == first_login_at
      assert Account.valid_password?(account, payload.password)
    end
  end
end 
