defmodule Operately.Repo.Migrations.UpdateTimeframesInGoalTimeframeEditingActivities do
  use Ecto.Migration

  def up do
    {:ok, %{error_count: 0}} =
      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalTimeframeEditing.run()
  end

  def down do
  end
end
