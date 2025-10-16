defmodule Operately.Repo.Migrations.PopulateExistingProjectMilestonesWithSubscriptionList do
  use Ecto.Migration

  def up do
    Operately.Data.Change083CreateSubscriptionListsForMilestones.run()
  end

  def down do
  end
end
