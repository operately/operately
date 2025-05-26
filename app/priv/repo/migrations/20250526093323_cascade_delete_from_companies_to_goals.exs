defmodule Operately.Repo.Migrations.CascadeDeleteFromCompaniesToGoals do
  use Ecto.Migration

  def up do
    # Drop the existing foreign key constraint
    drop constraint(:goals, :goals_company_id_fkey)

    # Add the constraint back with cascade delete
    alter table(:goals) do
      modify :company_id, references(:companies, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    # Revert back to the original constraint
    drop constraint(:goals, :goals_company_id_fkey)

    alter table(:people) do
      modify :company_id, references(:companies, on_delete: :nothing, type: :binary_id)
    end
  end
end
