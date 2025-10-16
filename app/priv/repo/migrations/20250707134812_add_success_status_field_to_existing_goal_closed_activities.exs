defmodule Operately.Repo.Migrations.AddSuccessStatusFieldToExistingGoalClosedActivities do
  use Ecto.Migration

  def up do
    Operately.Data.Change064SetGoalClosingActivitySuccessStatus.run()
  end

  def down do
  end
end
