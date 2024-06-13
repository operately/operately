defmodule Operately.Repo.Migrations.AddBlobIdToPeopleTable do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :avatar_blob_id, references(:blobs, on_delete: :delete_all, type: :binary_id)
    end
  end
end
