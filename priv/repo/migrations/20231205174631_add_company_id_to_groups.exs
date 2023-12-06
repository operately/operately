defmodule Operately.Repo.Migrations.AddCompanyIdToGroups do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      add :company_id, references(:companies, type: :binary_id)
    end
  end
end
