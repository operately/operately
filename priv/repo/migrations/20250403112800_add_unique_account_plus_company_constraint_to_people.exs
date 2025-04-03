defmodule Operately.Repo.Migrations.AddUniqueAccountPlusCompanyConstraintToPeople do
  use Ecto.Migration

  def change do
    create unique_index(:people, [:company_id, :account_id])
  end
end
