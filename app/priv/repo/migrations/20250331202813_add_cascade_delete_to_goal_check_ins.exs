defmodule Operately.Repo.Migrations.AddCascadeDeleteToGoalCheckIns do
  use Ecto.Migration

  def up do
    drop constraint(:goal_updates, "goal_updates_goal_id_fkey")

    alter table(:goal_updates) do
      modify :goal_id, references(:goals, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:goal_updates, "goal_updates_goal_id_fkey")

    alter table(:goal_updates) do
      modify :goal_id, references(:goals, on_delete: :nothing, type: :binary_id)
    end
  end
end
