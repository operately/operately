defmodule Operately.Repo.Migrations.AddAccessStateFieldsToCompanyBillingAccounts do
  use Ecto.Migration

  def change do
    alter table(:company_billing_accounts) do
      add :access_state, :string, null: false, default: "normal"
      add :access_state_reason, :string
      add :access_state_started_at, :utc_datetime
      add :access_state_ends_at, :utc_datetime
    end
  end
end
