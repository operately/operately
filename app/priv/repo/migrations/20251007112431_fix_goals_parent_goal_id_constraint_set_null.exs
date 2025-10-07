defmodule Operately.Repo.Migrations.FixGoalsParentGoalIdConstraintSetNull do
  use Ecto.Migration

  def up do
    drop constraint(:goals, :goals_parent_goal_id_fkey)

    alter table(:goals) do
      modify :parent_goal_id, references(:goals, on_delete: :nilify_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:goals, :goals_parent_goal_id_fkey)

    alter table(:goals) do
      modify :parent_goal_id, references(:goals, on_delete: :nothing, type: :binary_id)
    end
  end
end
