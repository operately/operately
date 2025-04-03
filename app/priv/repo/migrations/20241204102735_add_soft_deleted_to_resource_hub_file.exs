defmodule Operately.Repo.Migrations.AddSoftDeletedToResourceHubFile do
  use Ecto.Migration

  def change do
    alter table(:resource_files) do
      add(:deleted_at, :utc_datetime_usec, [])
    end
  end
end
