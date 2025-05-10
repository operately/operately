defmodule Operately.Repo.Migrations.AddCascadeDeleteToPersonAndAccessGroups do
  use Ecto.Migration

  def up do
    drop constraint(:access_groups, "access_groups_person_id_fkey")

    alter table(:access_groups) do
      modify :person_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_groups, "access_groups_person_id_fkey")

    alter table(:access_groups) do
      modify :person_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end
