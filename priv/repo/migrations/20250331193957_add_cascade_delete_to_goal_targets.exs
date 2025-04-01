defmodule Operately.Repo.Migrations.AddCascadeDeleteToGoalTargets do
  use Ecto.Migration

  def up do
    drop constraint(:targets, "targets_goal_id_fkey")

    alter table(:targets) do
      modify :goal_id, references(:goals, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:targets, "targets_goal_id_fkey")

    alter table(:targets) do
      modify :goal_id, references(:goals, on_delete: :nothing, type: :binary_id)
    end
  end
end
