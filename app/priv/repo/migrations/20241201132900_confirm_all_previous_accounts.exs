defmodule Operately.Repo.Migrations.ConfirmAllPreviousAccounts do
  use Ecto.Migration

  def change do
    execute "UPDATE accounts SET confirmed_at = NOW()"
  end
end
