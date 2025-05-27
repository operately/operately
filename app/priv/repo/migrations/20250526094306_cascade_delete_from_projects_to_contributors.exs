defmodule Operately.Repo.Migrations.CascadeDeleteFromProjectsToContributors do
  use Ecto.Migration

  def up do
    drop constraint(:project_contributors, :project_contributors_person_id_fkey)

    alter table(:project_contributors) do
      modify :person_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:project_contributors, :project_contributors_person_id_fkey)

    alter table(:project_contributors) do
      modify :person_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end
