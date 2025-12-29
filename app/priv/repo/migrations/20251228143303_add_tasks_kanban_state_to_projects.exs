defmodule Operately.Repo.Migrations.AddTasksKanbanStateToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :tasks_kanban_state, :map, default: %{}
    end
  end
end
