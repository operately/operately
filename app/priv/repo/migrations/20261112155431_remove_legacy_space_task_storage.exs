defmodule Operately.Repo.Migrations.RemoveLegacySpaceTaskStorage do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      remove :task_statuses, {:array, :map}, default: []
      remove :tasks_kanban_state, :map, default: %{}
    end
  end
end
