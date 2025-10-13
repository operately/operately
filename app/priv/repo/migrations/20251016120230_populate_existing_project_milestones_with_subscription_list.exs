defmodule Operately.Repo.Migrations.PopulateExistingProjectMilestonesWithSubscriptionList do
  use Ecto.Migration

  def up do
    Operately.Data.Change083CreateSubscriptionListsForMilestones.run()

    alter table(:project_milestones) do
      modify :subscription_list_id, :binary_id, null: false
    end
  end

  def down do
    raise "Cannot safely remove subscription lists from project milestones"
  end
end
