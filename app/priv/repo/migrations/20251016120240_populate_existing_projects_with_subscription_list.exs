defmodule Operately.Repo.Migrations.PopulateExistingProjectsWithSubscriptionList do
  use Ecto.Migration

  def up do
    Operately.Data.Change084CreateSubscriptionListsForProjects.run()
  end

  def down do

  end
end
