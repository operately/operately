defmodule Operately.Repo.Migrations.CascadeDeleteFromCompaniesToProjects do
  use Ecto.Migration

  def up do
    # Drop the existing foreign key constraint
    drop constraint(:projects, :projects_company_id_fkey)

    # Add the constraint back with cascade delete
    alter table(:projects) do
      modify :company_id, references(:companies, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    # Revert back to the original constraint
    drop constraint(:projects, :projects_company_id_fkey)

    alter table(:people) do
      modify :company_id, references(:companies, on_delete: :nothing, type: :binary_id)
    end
  end
end
