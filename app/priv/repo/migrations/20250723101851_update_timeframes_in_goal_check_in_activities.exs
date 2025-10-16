defmodule Operately.Repo.Migrations.UpdateTimeframesInGoalCheckInActivities do
  use Ecto.Migration

  def up do
    {:ok, %{error_count: 0}} =
      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCheckIn.run()
  end

  def down do
  end
end
