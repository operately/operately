defmodule Operately.People.EmailChangeTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.People.{AccountToken, EmailChange, Person}
  import Operately.Support.EmailChange.Helpers
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "confirmation updates every profile and keeps sessions and passwords", ctx do
    ctx = Factory.add_company(ctx, :second_company, ctx.account)
    session = Operately.People.generate_account_session_token(ctx.account)
    {reset, token} = AccountToken.build_email_token(ctx.account, "reset_password")
    Repo.insert!(token)
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    code = delivered_code()
    formatted = String.slice(code, 0, 3) <> "-" <> String.slice(code, 3, 3)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = EmailChange.confirm(ctx.account, request.id, " #{String.downcase(formatted)} ")
      assert_enqueued(worker: Operately.People.EmailChangedEmailWorker, args: %{old_email: ctx.account.email, new_email: "new@example.com"})
    end)

    assert Repo.reload!(ctx.account).email == "new@example.com"
    assert Repo.reload!(ctx.account).hashed_password == ctx.account.hashed_password
    assert Repo.all(from p in Person, where: p.account_id == ^ctx.account.id, select: p.email) == ["new@example.com", "new@example.com"]
    assert Operately.People.get_account_by_session_token(session).id == ctx.account.id
    refute Operately.People.get_account_by_reset_password_token(reset)
    assert {:error, :request_invalid} = EmailChange.confirm(ctx.account, request.id, code)
    assert is_nil(EmailChange.state(ctx.account).pending)
  end

  test "the new email signs in with the existing password and the old email no longer does", ctx do
    password = Operately.PeopleFixtures.valid_account_password()
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    assert :ok = EmailChange.confirm(ctx.account, request.id, delivered_code())
    assert Operately.People.get_account_by_email_and_password("new@example.com", password).id == ctx.account.id
    refute Operately.People.get_account_by_email_and_password(ctx.account.email, password)
    assert {:ok, account, :existing} = Operately.People.find_or_create_account_with_source(%{email: "new@example.com", name: "Account", image: nil})
    assert account.id == ctx.account.id
  end

  defp delivered_code do
    assert_receive {:email, %Swoosh.Email{subject: "Operately email change code: " <> code}}
    String.replace(code, "-", "")
  end
end
