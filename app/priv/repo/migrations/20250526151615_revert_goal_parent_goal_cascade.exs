defmodule Operately.Repo.Migrations.RevertGoalParentGoalCascade do
  use Ecto.Migration

  def up do
    drop constraint(:goals, :goals_parent_goal_id_fkey)

    alter table(:goals) do
      modify :parent_goal_id, references(:goals, on_delete: :nothing, type: :binary_id)
    end

    drop constraint(:projects, :projects_goal_id_fkey)

    alter table(:projects) do
      modify :goal_id, references(:goals, on_delete: :nothing, type: :binary_id)
    end
  end

  def down do
    drop constraint(:goals, :goals_parent_goal_id_fkey)

    alter table(:goals) do
      modify :parent_goal_id, references(:goals, on_delete: :delete_all, type: :binary_id)
    end

    drop constraint(:projects, :projects_goal_id_fkey)

    alter table(:project) do
      modify :goal_id, references(:goals, on_delete: :delete_all, type: :binary_id)
    end
  end
end
