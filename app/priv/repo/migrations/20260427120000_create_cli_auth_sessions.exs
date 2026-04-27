defmodule Operately.Repo.Migrations.CreateCliAuthSessions do
  use Ecto.Migration

  def change do
    create table(:cli_auth_sessions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :account_id, references(:accounts, type: :binary_id, on_delete: :delete_all)
      add :token_hash, :binary, null: false
      add :auth_method, :string, null: false
      add :status, :string, null: false
      add :failure_reason, :string
      add :expires_at, :utc_datetime, null: false

      timestamps()
    end

    create index(:cli_auth_sessions, [:account_id])
    create index(:cli_auth_sessions, [:expires_at])
    create unique_index(:cli_auth_sessions, [:token_hash])
  end
end
