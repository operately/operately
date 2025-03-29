defmodule Operately.Repo.Migrations.AddSubscriptionListRelationshipWithMessagesTable do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)
    end

    create index(:messages, [:subscription_list_id])
  end
end
