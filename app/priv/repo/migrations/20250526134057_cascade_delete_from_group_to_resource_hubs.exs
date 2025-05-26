defmodule Operately.Repo.Migrations.CascadeDeleteFromGroupToResourceHubs do
  use Ecto.Migration

  def up do
    drop constraint(:resource_hubs, :resource_hubs_space_id_fkey)
    drop constraint(:resource_nodes, :resource_nodes_resource_hub_id_fkey)
    drop constraint(:resource_links, :resource_links_node_id_fkey)
    drop constraint(:resource_folders, :resource_folders_node_id_fkey)
    drop constraint(:resource_files, :resource_files_node_id_fkey)
    drop constraint(:resource_documents, :resource_documents_node_id_fkey)

    alter table(:resource_hubs) do
      modify :space_id, references(:groups, on_delete: :delete_all, type: :binary_id)
    end

    alter table(:resource_nodes) do
      modify :resource_hub_id,
             references(:resource_hubs, on_delete: :delete_all, type: :binary_id)
    end

    alter table(:resource_links) do
      modify :node_id, references(:resource_nodes, on_delete: :delete_all, type: :binary_id)
    end

    alter table(:resource_folders) do
      modify :node_id, references(:resource_nodes, on_delete: :delete_all, type: :binary_id)
    end

    alter table(:resource_files) do
      modify :node_id, references(:resource_nodes, on_delete: :delete_all, type: :binary_id)
    end

    alter table(:resource_documents) do
      modify :node_id, references(:resource_nodes, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:resource_hubs, :resource_hubs_space_id_fkey)
    drop constraint(:resource_nodes, :resource_nodes_resource_hub_id_fkey)
    drop constraint(:resource_links, :resource_links_node_id_fkey)
    drop constraint(:resource_folders, :resource_folders_node_id_fkey)
    drop constraint(:resource_files, :resource_files_node_id_fkey)
    drop constraint(:resource_documents, :resource_documents_node_id_fkey)

    alter table(:resource_hubs) do
      modify :space_id, references(:groups, on_delete: :nothing, type: :binary_id)
    end

    alter table(:resource_nodes) do
      modify :resource_hub_id, references(:resource_hubs, on_delete: :nothing, type: :binary_id)
    end

    alter table(:resource_links) do
      modify :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)
    end

    alter table(:resource_folders) do
      modify :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)
    end

    alter table(:resource_files) do
      modify :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)
    end

    alter table(:resource_documents) do
      modify :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)
    end
  end
end
