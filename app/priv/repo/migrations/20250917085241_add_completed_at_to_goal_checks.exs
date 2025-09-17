defmodule Operately.Repo.Migrations.AddCompletedAtToGoalChecks do
  use Ecto.Migration

  def change do
    alter table(:goal_checks) do
      add :completed_at, :utc_datetime
    end
  end
end