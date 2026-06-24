defmodule Operately.Repo.Migrations.CreateMcpFoundations do
  use Ecto.Migration

  def change do
    create table(:mcp_grants, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :account_id, references(:accounts, type: :binary_id, on_delete: :delete_all), null: false
      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all), null: false
      add :client_id, :string, null: false
      add :client_name, :string, null: false
      add :client_uri, :string
      add :redirect_uri, :string, null: false
      add :resource, :string, null: false
      add :scopes, {:array, :string}, null: false, default: []
      add :revoked_at, :utc_datetime

      timestamps()
    end

    create unique_index(:mcp_grants, [:account_id, :company_id, :client_id])
    create index(:mcp_grants, [:company_id])

    create table(:mcp_authorization_codes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :grant_id, references(:mcp_grants, type: :binary_id, on_delete: :delete_all), null: false
      add :code_hash, :binary, null: false
      add :redirect_uri, :string, null: false
      add :resource, :string, null: false
      add :scopes, {:array, :string}, null: false, default: []
      add :code_challenge, :string, null: false
      add :code_challenge_method, :string, null: false
      add :expires_at, :utc_datetime, null: false
      add :consumed_at, :utc_datetime

      timestamps()
    end

    create unique_index(:mcp_authorization_codes, [:code_hash])
    create index(:mcp_authorization_codes, [:grant_id])
    create index(:mcp_authorization_codes, [:expires_at])

    create table(:mcp_access_tokens, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :grant_id, references(:mcp_grants, type: :binary_id, on_delete: :delete_all), null: false
      add :token_hash, :binary, null: false
      add :resource, :string, null: false
      add :scopes, {:array, :string}, null: false, default: []
      add :expires_at, :utc_datetime, null: false
      add :revoked_at, :utc_datetime
      add :last_used_at, :utc_datetime

      timestamps()
    end

    create unique_index(:mcp_access_tokens, [:token_hash])
    create index(:mcp_access_tokens, [:grant_id])
    create index(:mcp_access_tokens, [:expires_at])

    create table(:mcp_refresh_tokens, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :grant_id, references(:mcp_grants, type: :binary_id, on_delete: :delete_all), null: false
      add :token_hash, :binary, null: false
      add :resource, :string, null: false
      add :scopes, {:array, :string}, null: false, default: []
      add :expires_at, :utc_datetime, null: false
      add :revoked_at, :utc_datetime
      add :used_at, :utc_datetime
      add :previous_token_id, references(:mcp_refresh_tokens, type: :binary_id, on_delete: :nilify_all)
      add :replaced_by_token_id, references(:mcp_refresh_tokens, type: :binary_id, on_delete: :nilify_all)

      timestamps()
    end

    create unique_index(:mcp_refresh_tokens, [:token_hash])
    create index(:mcp_refresh_tokens, [:grant_id])
    create index(:mcp_refresh_tokens, [:expires_at])
    create index(:mcp_refresh_tokens, [:previous_token_id])

    create table(:mcp_sessions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :grant_id, references(:mcp_grants, type: :binary_id, on_delete: :delete_all), null: false
      add :access_token_id, references(:mcp_access_tokens, type: :binary_id, on_delete: :delete_all), null: false
      add :protocol_version, :string, null: false
      add :client_name, :string
      add :client_version, :string
      add :client_capabilities, :map, null: false, default: %{}
      add :initialized_at, :utc_datetime
      add :last_seen_at, :utc_datetime, null: false
      add :closed_at, :utc_datetime

      timestamps()
    end

    create index(:mcp_sessions, [:grant_id])
    create index(:mcp_sessions, [:access_token_id])
  end
end
