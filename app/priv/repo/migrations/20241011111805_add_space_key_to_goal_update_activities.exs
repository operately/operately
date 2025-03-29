defmodule Operately.Repo.Migrations.AddSpaceKeyToGoalUpdateActivities do
  use Ecto.Migration

  def up do
    Operately.Data.Change037AddSpaceToGoalUpdateActivities.run()
  end

  def down do

  end
end
