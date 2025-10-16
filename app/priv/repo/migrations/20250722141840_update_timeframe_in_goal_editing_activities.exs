defmodule Operately.Repo.Migrations.UpdateTimeframeInGoalEditingActivities do
  use Ecto.Migration

  def up do
    {:ok, %{error_count: 0}} =
      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalEditing.run()
  end

  def down do
  end
end
