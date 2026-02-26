defmodule Operately.Repo.Migrations.CreateApiTokens do
  use Ecto.Migration

  def change do
    create table(:api_tokens, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :person_id, references(:people, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string
      add :token_hash, :binary, null: false
      add :read_only, :boolean, null: false, default: true
      add :last_used_at, :utc_datetime
      timestamps()
    end

    create unique_index(:api_tokens, [:token_hash])
    create index(:api_tokens, [:person_id])
  end
end
