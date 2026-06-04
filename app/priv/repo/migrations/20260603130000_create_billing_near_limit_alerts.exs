defmodule Operately.Repo.Migrations.CreateBillingNearLimitAlerts do
  use Ecto.Migration

  def change do
    create table(:billing_near_limit_alerts, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all),
        null: false

      add :limit_key, :string, null: false
      add :sent_at, :utc_datetime, null: false

      timestamps()
    end

    create unique_index(:billing_near_limit_alerts, [:company_id, :limit_key])
  end
end
