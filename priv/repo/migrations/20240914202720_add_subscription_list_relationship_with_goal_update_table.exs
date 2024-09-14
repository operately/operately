defmodule Operately.Repo.Migrations.AddSubscriptionListRelationshipWithGoalUpdateTable do
  use Ecto.Migration

  def change do
    alter table(:goal_updates) do
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)
    end

    create index(:goal_updates, [:subscription_list_id])
  end
end
