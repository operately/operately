defmodule Operately.Repo.Migrations.AddBlobIdToBlobTable do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :blob_id, references(:blobs, on_delete: :delete_all, type: :binary_id)
    end
  end
end
