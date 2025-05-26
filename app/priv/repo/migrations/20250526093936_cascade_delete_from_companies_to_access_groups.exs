defmodule Operately.Repo.Migrations.CascadeDeleteFromCompaniesToAccessGroups do
  use Ecto.Migration

  def up do
    drop constraint(:access_groups, :access_groups_company_id_fkey)

    alter table(:access_groups) do
      modify :company_id, references(:companies, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_groups, :access_groups_company_id_fkey)

    alter table(:access_groups) do
      modify :company_id, references(:companies, on_delete: :nothing, type: :binary_id)
    end
  end
end
