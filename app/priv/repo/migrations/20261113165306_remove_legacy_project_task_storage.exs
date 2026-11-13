defmodule Operately.Repo.Migrations.RemoveLegacyProjectTaskStorage do
  use Ecto.Migration

  def up do
    alter table(:tasks) do
      modify :board_id, :binary_id, null: false
    end

    alter table(:projects) do
      remove :task_statuses
      remove :tasks_kanban_state
    end
  end

  def down do
    alter table(:projects) do
      add :task_statuses, {:array, :map}, default: []
      add :tasks_kanban_state, :map, default: %{}
    end

    alter table(:tasks) do
      modify :board_id, :binary_id, null: true
    end

    flush()
    Operately.Data.Change123FinalizeTaskBoards.restore_project_workflows()
  end
end
