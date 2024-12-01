defmodule Operately.Repo.Migrations.ConfirmAllPreviousAccounts do
  use Ecto.Migration

  def change do
    Operately.Repo.update_all(Operately.People.Account, set: [confirmed_at: DateTime.utc_now()])
  end
end
