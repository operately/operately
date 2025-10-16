defmodule Operately.Repo.Migrations.AddSubscriptionListToProjects do
  use Ecto.Migration

  def up do
    alter table(:projects) do
      add :subscription_list_id,
          references(:subscription_lists, on_delete: :delete_all, type: :binary_id),
          null: true
    end

    create index(:projects, [:subscription_list_id])
  end

  def down do
    drop index(:projects, [:subscription_list_id])

    alter table(:projects) do
      remove :subscription_list_id
    end
  end
end
