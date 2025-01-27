defmodule Operately.Repo.Migrations.DeleteGoalReparentActivitiesWithMissingData do
  use Ecto.Migration

  def up do
    Operately.Data.Change048DeleteGoalReparentActivitiesWithMissingData.run()
  end

  def down do

  end
end
