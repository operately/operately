defmodule Operately.Repo.Migrations.CreateBillingTables do
  use Ecto.Migration

  def change do
    create table(:company_billing_accounts, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all),
        null: false

      add :provider, :string, null: false
      add :plan_key, :string
      add :billing_interval, :string
      add :status, :string, null: false, default: "free"
      add :suggested_plan_key, :string
      add :suggested_billing_interval, :string
      add :suggested_plan_source, :string
      add :current_period_end, :utc_datetime
      add :cancel_at_period_end, :boolean, default: false
      add :pending_plan_key, :string
      add :pending_billing_interval, :string
      add :pending_checkout_started_at, :utc_datetime
      add :last_synced_at, :utc_datetime

      timestamps()
    end

    create unique_index(:company_billing_accounts, [:company_id])

    create table(:billing_products, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :provider, :string, null: false
      add :plan_family, :string, null: false
      add :billing_interval, :string, null: false
      add :polar_product_id, :string, null: false
      add :polar_product_name, :string
      add :price_amount, :integer
      add :price_currency, :string
      add :version, :integer, default: 1
      add :active, :boolean, default: false
      add :archived_at, :utc_datetime
      add :provider_payload, :map
      add :last_synced_at, :utc_datetime

      timestamps()
    end

    create unique_index(:billing_products, [:provider, :plan_family, :billing_interval],
             where: "active = true",
             name: "billing_products_active_unique_index"
           )

    create index(:billing_products, [:provider, :plan_family, :billing_interval])

    create table(:billing_webhook_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :provider, :string, null: false
      add :event_id, :string, null: false
      add :event_type, :string, null: false
      add :payload, :map, null: false
      add :received_at, :utc_datetime, null: false
      add :processed_at, :utc_datetime
      add :status, :string, null: false, default: "pending"
      add :error, :text

      timestamps()
    end

    create unique_index(:billing_webhook_events, [:provider, :event_id])
    create index(:billing_webhook_events, [:status, :processed_at])
  end
end
