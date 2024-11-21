defmodule Operately.Repo.Migrations.AddResourceHubFilesSchema do
  use Ecto.Migration

  def change do
    create table(:resource_files, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)
      add :blob_id, references(:blobs, on_delete: :nothing, type: :binary_id)

      add :description, :map

      timestamps()
    end

    create index(:resource_files, [:node_id])
    create index(:resource_files, [:author_id])
    create index(:resource_files, [:blob_id])
  end
end
