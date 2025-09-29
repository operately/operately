defmodule Operately.Repo.Migrations.PopulateExistingProjectTasksWithSubscriptionList do
  use Ecto.Migration

  def up do
    Operately.Data.Change080CreateSubscriptionsListForTasks.run()
  end

  def down do

  end
end
