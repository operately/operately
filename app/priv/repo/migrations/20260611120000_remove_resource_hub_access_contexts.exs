defmodule Operately.Repo.Migrations.RemoveResourceHubAccessContexts do
  use Ecto.Migration

  def up do
    execute("""
      DELETE FROM access_contexts
      WHERE resource_hub_id IS NOT NULL;
    """)

    drop_if_exists unique_index(:access_contexts, [:resource_hub_id])

    alter table(:access_contexts) do
      remove :resource_hub_id
    end
  end

  def down do
    alter table(:access_contexts) do
      add :resource_hub_id, references(:resource_hubs, on_delete: :delete_all, type: :binary_id)
    end

    create unique_index(:access_contexts, [:resource_hub_id])
  end
end
