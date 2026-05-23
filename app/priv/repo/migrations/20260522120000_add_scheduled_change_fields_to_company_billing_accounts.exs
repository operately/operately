defmodule Operately.Repo.Migrations.AddScheduledChangeFieldsToCompanyBillingAccounts do
  use Ecto.Migration

  def change do
    alter table(:company_billing_accounts) do
      add :scheduled_plan_key, :string
      add :scheduled_billing_interval, :string
      add :scheduled_change_effective_at, :utc_datetime
    end
  end
end
