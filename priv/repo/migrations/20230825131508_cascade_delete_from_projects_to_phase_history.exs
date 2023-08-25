defmodule Operately.Repo.Migrations.CascadeDeleteFromProjectsToPhaseHistory do
  use Ecto.Migration

  def change do
    drop constraint(:project_phase_history, "project_phase_history_project_id_fkey")

    alter table(:project_phase_history) do
      modify :project_id, references(:projects, on_delete: :delete_all, type: :binary_id)
    end
  end
end
