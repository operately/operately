defmodule Operately.Repo.Migrations.AddStorageType do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :storage_type, :string, default: "s3"
    end
  end
end
