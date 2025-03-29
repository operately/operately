defmodule Operately.Repo.Migrations.AddSubscriptionListRelationshipWithProjectCheckInTable do
  use Ecto.Migration

  def change do
    alter table(:project_check_ins) do
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id), null: true
    end

    create index(:project_check_ins, [:subscription_list_id])
  end
end
