defmodule Operately.Repo.Migrations.CreateMcpOauthTables do
  use Ecto.Migration

  def change do
    create table(:mcp_oauth_authorizations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :code_hash, :binary, null: false
      add :code_challenge, :string, null: false
      add :code_challenge_method, :string, null: false
      add :redirect_uri, :text, null: false
      add :scope, :text
      add :client_id, :string, null: false
      add :resource, :text, null: false
      add :expires_at, :utc_datetime_usec, null: false

      add :account_id, references(:accounts, type: :binary_id, on_delete: :delete_all),
        null: false

      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all),
        null: false

      timestamps()
    end

    create index(:mcp_oauth_authorizations, [:code_hash])
    create index(:mcp_oauth_authorizations, [:account_id])
    create index(:mcp_oauth_authorizations, [:company_id])

    create table(:mcp_oauth_tokens, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :access_token_hash, :binary, null: false
      add :refresh_token_hash, :binary, null: false
      add :access_token_expires_at, :utc_datetime_usec, null: false
      add :refresh_token_expires_at, :utc_datetime_usec, null: false
      add :scope, :text
      add :client_id, :string, null: false
      add :resource, :text, null: false

      add :account_id, references(:accounts, type: :binary_id, on_delete: :delete_all),
        null: false

      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all),
        null: false

      add :revoked_at, :utc_datetime_usec

      timestamps()
    end

    create index(:mcp_oauth_tokens, [:access_token_hash])
    create index(:mcp_oauth_tokens, [:refresh_token_hash])
    create index(:mcp_oauth_tokens, [:account_id])
    create index(:mcp_oauth_tokens, [:company_id])
  end
end
