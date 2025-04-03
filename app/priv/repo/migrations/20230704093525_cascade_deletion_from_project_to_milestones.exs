defmodule Operately.Repo.Migrations.CascadeDeletionFromProjectToMilestones do
  use Ecto.Migration

  def change do
    drop constraint(:project_milestones, :project_milestones_project_id_fkey)

    alter table(:project_milestones) do
      modify :project_id, references(:projects, on_delete: :delete_all, type: :binary_id)
    end
  end
end
