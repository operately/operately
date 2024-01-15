defmodule Operately.Repo.Migrations.AddCompanySpaceIdToCompanies do
  use Ecto.Migration

  def change do
    alter table(:companies) do
      add :company_space_id, references(:groups, type: :binary_id)
    end
  end
end
