defmodule Operately.Repo.Migrations.UpdateTimeframesInGoalCreatedActivities do
  use Ecto.Migration

  def up do
    {:ok, %{error_count: 0}} =
      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCreated.run()
  end

  def down do
  end
end
