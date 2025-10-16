defmodule Operately.Repo.Migrations.AddSubscriptionListToProjectMilestones do
  use Ecto.Migration

  def up do
    alter table(:project_milestones) do
      add :subscription_list_id,
          references(:subscription_lists, on_delete: :delete_all, type: :binary_id),
          null: true
    end

    create index(:project_milestones, [:subscription_list_id])
  end

  def down do
    drop index(:project_milestones, [:subscription_list_id])

    alter table(:project_milestones) do
      remove :subscription_list_id
    end
  end
end
