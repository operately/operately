defmodule Operately.Repo.Migrations.AddMilestoneIdToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :milestone_id, references(:project_milestones, type: :binary_id)
    end
  end
end
