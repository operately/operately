defmodule Operately.Repo.Migrations.AddStorageTypeToBlob do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :storage_type, :string
    end
  end
end
