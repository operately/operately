defmodule Operately.Repo.Migrations.AddDeletedAtToAccounts do
  use Ecto.Migration

  def up do
    alter table(:accounts) do
      add :deleted_at, :utc_datetime_usec
      modify :hashed_password, :string, null: true
    end

    create index(:accounts, [:deleted_at])
  end

  def down do
    execute "UPDATE accounts SET hashed_password = 'deleted-account' WHERE hashed_password IS NULL"

    drop index(:accounts, [:deleted_at])

    alter table(:accounts) do
      remove :deleted_at
      modify :hashed_password, :string, null: false
    end
  end
end
