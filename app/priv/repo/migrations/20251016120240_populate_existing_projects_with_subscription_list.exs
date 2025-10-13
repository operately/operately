defmodule Operately.Repo.Migrations.PopulateExistingProjectsWithSubscriptionList do
  use Ecto.Migration

  def up do
    Operately.Data.Change084CreateSubscriptionListsForProjects.run()

    alter table(:projects) do
      modify :subscription_list_id, :binary_id, null: false
    end
  end

  def down do
    raise "Cannot safely remove subscription lists from projects"
  end
end
