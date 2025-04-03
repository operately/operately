defmodule Operately.Repo.Migrations.AddSoftDeletedToFolders do
  use Ecto.Migration

  def change do
    alter table(:resource_folders) do
      add(:deleted_at, :utc_datetime_usec, [])
    end
  end
end
