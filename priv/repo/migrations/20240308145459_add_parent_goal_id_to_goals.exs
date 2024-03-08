defmodule Operately.Repo.Migrations.AddParentGoalIdToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :parent_goal_id, references(:goals, type: :binary_id)
    end
  end
end
