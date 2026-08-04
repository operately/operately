defmodule Operately.Repo.Migrations.AddSubscriptionListToKpis do
  use Ecto.Migration

  def change do
    alter table(:kpis) do
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)
    end

    create index(:kpis, [:subscription_list_id])
  end
end
