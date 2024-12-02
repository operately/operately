defmodule Operately.Repo.Migrations.AddSubscriptionsListFieldToResourceHubFile do
  use Ecto.Migration

  def change do
    alter table(:resource_files) do
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)
    end

    create index(:resource_files, [:subscription_list_id])
  end
end
