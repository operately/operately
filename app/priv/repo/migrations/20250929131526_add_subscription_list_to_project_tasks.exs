defmodule Operately.Repo.Migrations.AddSubscriptionListToProjectTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :subscription_list_id,
          references(:subscription_lists, on_delete: :delete_all, type: :binary_id),
          null: true
    end

    create index(:tasks, [:subscription_list_id])
  end
end
