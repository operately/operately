defmodule Operately.Repo.Migrations.CreateSiteMessages do
  use Ecto.Migration

  def change do
    create table(:site_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string, null: false
      add :description, :map, null: false
      add :all_companies, :boolean, null: false, default: false
      add :active, :boolean, null: false, default: true
      add :expires_at, :utc_datetime

      timestamps()
    end

    create table(:site_message_companies, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :site_message_id, references(:site_messages, type: :binary_id, on_delete: :delete_all), null: false
      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all), null: false
    end

    create unique_index(:site_message_companies, [:site_message_id, :company_id])
    create index(:site_message_companies, [:company_id])
  end
end
