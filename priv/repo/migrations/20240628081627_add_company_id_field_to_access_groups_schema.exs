defmodule Operately.Repo.Migrations.AddCompanyIdFieldToAccessGroupsSchema do
  use Ecto.Migration

  def change do
    alter table(:access_groups) do
      add :company_id, references(:companies, type: :binary_id, on_delete: :nothing)
    end

    create index(:access_groups, [:company_id])
  end
end
