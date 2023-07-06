defmodule Operately.Repo.Migrations.CascadeDeleteFromProjectToContributors do
  use Ecto.Migration

  def change do
    drop constraint(:project_contributors, :project_contributors_project_id_fkey)

    alter table(:project_contributors) do
      modify :project_id, references(:projects, on_delete: :delete_all, type: :binary_id)
    end
  end
end
