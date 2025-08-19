defmodule Operately.Repo.Migrations.AddProjectIdAndProjectNameAndTaskNameToChangeTaskDescriptionActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change075EnhanceTaskDescriptionChangeActivities.run()
  end

  def down do

  end
end
