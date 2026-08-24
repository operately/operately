defmodule Operately.Repo.Migrations.AddSubscriptionListToKpis do
  use Ecto.Migration

  def up do
    alter table(:kpis) do
      add :subscription_list_id, references(:subscription_lists, on_delete: :delete_all, type: :binary_id), null: true
    end

    create index(:kpis, [:subscription_list_id])

    flush()

    Operately.Data.Change113CreateSubscriptionListsForKpis.run()
  end

  def down do
    drop index(:kpis, [:subscription_list_id])

    alter table(:kpis) do
      remove :subscription_list_id
    end
  end
end
