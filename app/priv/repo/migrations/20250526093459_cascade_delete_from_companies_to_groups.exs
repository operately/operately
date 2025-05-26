defmodule Operately.Repo.Migrations.CascadeDeleteFromCompaniesToGroups do
  use Ecto.Migration

  def up do
    drop constraint(:groups, :groups_company_id_fkey)

    alter table(:groups) do
      modify :company_id, references(:companies, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:groups, :groups_company_id_fkey)

    alter table(:groups) do
      modify :company_id, references(:companies, on_delete: :nothing, type: :binary_id)
    end
  end
end
