defmodule Operately.Repo.Migrations.AddTasksKanbanStateFieldToSpaceSchema do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      add :tasks_kanban_state, :map, default: %{}
    end
  end
end
