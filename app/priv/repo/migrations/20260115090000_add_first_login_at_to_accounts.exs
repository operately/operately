defmodule Operately.Repo.Migrations.AddFirstLoginAtToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      add :first_login_at, :utc_datetime
    end
  end
end
