defmodule Operately.Repo.Migrations.UpdateTimeframesInGoalCheckInEditActivities do
  use Ecto.Migration

  def up do
    {:ok, %{error_count: 0}} =
      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCheckInEdit.run()
  end

  def down do
  end
end
