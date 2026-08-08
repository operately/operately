defmodule Operately.Repo.Migrations.AddGoalIdIndexToGoalChecks do
  use Ecto.Migration

  def change do
    create index(:goal_checks, [:goal_id])
  end
end
