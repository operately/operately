defmodule Operately.Repo.Migrations.CreateConversionAnalytics do
  use Ecto.Migration

  def change do
    create table(:analytics_accounts, primary_key: false) do
      add :account_id, references(:accounts, type: :uuid, on_delete: :delete_all),
        primary_key: true

      add :attribution, :map, null: false, default: %{}
      add :opted_out, :boolean, null: false, default: false
      add :signup_kind, :string
      add :completed_at, :utc_datetime_usec
    end

    create table(:analytics_companies, primary_key: false) do
      add :company_id, references(:companies, type: :uuid, on_delete: :delete_all),
        primary_key: true

      add :creator_account_id, references(:accounts, type: :uuid, on_delete: :nilify_all)
      add :attribution, :map, null: false, default: %{}
      add :created_at, :utc_datetime_usec, null: false
    end

    create table(:analytics_activations, primary_key: false) do
      add :company_id, references(:companies, type: :uuid, on_delete: :delete_all),
        primary_key: true

      add :rule_version, :integer, primary_key: true
      add :activated_at, :utc_datetime_usec, null: false
    end

    alter table(:email_activation_codes) do
      add :analytics_context, :map, null: false, default: %{}
    end
  end
end
