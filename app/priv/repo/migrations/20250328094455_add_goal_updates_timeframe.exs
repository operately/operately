defmodule Operately.Repo.Migrations.AddGoalUpdatesTimeframe do
  use Ecto.Migration

  def change do
    alter table(:goal_updates) do
      add :timeframe, :jsonb
    end
  end
end
