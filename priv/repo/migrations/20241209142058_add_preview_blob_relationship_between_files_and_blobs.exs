defmodule Operately.Repo.Migrations.AddPreviewBlobRelationshipBetweenFilesAndBlobs do
  use Ecto.Migration

  def change do
    alter table(:resource_files) do
      add :preview_blob_id, references(:blobs, on_delete: :nothing, type: :binary_id)
    end

    create index(:resource_files, [:preview_blob_id])
  end
end
