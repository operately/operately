defmodule Operately.Repo.Migrations.CreateMcpRegisteredOauthClients do
  use Ecto.Migration

  def change do
    create table(:mcp_registered_oauth_clients, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :client_name, :string, null: false
      add :client_uri, :string
      add :logo_uri, :string
      add :redirect_uris, {:array, :string}, null: false, default: []
      add :token_endpoint_auth_method, :string, null: false, default: "none"
      add :grant_types, {:array, :string}, null: false, default: ["authorization_code"]
      add :response_types, {:array, :string}, null: false, default: ["code"]

      timestamps()
    end

    create index(:mcp_registered_oauth_clients, [:inserted_at])
  end
end
