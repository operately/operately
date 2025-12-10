defmodule Operately.Repo.Migrations.PopulateTaskStatusesFieldInSpaceAndProjectSchema do
  use Ecto.Migration

  def up do
    Operately.Data.Change087PopulateDefaultTaskStatuses.run()
    Operately.Data.Change090PopulateDefaultTaskStatusesForSpaces.run()
  end

  def down do

  end
end
