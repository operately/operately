defmodule Operately.Mix.Tasks.Create.AccountTest do
  use Operately.DataCase

  test "run/1 creates an account" do
    assert Operately.Repo.aggregate(Operately.People.Account, :count, :id) == 0

    Mix.Tasks.Operately.Create.Account.run(["John Mayer", "john@localhost.dev", "password123456"])

    assert account = Operately.People.get_account_by_email_and_password("john@localhost.dev", "password123456")
    assert account.email == "john@localhost.dev"
  end
end
