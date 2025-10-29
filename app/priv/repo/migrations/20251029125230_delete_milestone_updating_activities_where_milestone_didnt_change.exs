defmodule Operately.Repo.Migrations.DeleteMilestoneUpdatingActivitiesWhereMilestoneDidntChange do
  use Ecto.Migration

  def up do
    Operately.Data.Change086DeleteDuplicateTaskMilestoneUpdatingActivities.run()
  end

  def down do

  end
end
