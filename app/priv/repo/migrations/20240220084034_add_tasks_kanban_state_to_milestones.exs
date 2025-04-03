defmodule Operately.Repo.Migrations.AddTasksKanbanStateToMilestones do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :tasks_kanban_state, :map, default: %{}
    end
  end
end
