defmodule Operately.Repo.Migrations.AddResourceHubResourceNodeAndFolder do
  use Ecto.Migration

  def change do
    # Create Resource hubs
    create table(:resource_hubs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :space_id, references(:groups, on_delete: :nothing, type: :binary_id)

      add :name, :string
      add :description, :map

      timestamps()
    end

    create index(:resource_hubs, [:space_id])

    # Add resource_hub_id to access_contexts
    alter table(:access_contexts) do
      add :resource_hub_id, references(:resource_hubs, on_delete: :nothing, type: :binary_id), null: true
    end

    create unique_index(:access_contexts, [:resource_hub_id])

    # Create nodes
    create table(:resource_nodes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :resource_hub_id, references(:resource_hubs, on_delete: :nothing, type: :binary_id)

      add :name, :string
      add :type, :string
    end

    create index(:resource_nodes, [:resource_hub_id])

    # Create folders
    create table(:resource_folders, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)

      add :description, :map
    end

    create index(:resource_folders, [:node_id])

    # Add folder_id to nodes
    alter table(:resource_nodes) do
      add :folder_id, references(:resource_folders, on_delete: :nothing, type: :binary_id)
    end

    create index(:resource_nodes, [:folder_id])
  end
end
