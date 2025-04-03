defmodule Operately.Repo.Migrations.AddSoftDeletedToDocuments do
  use Ecto.Migration

  def change do
    alter table(:resource_nodes) do
      add(:deleted_at, :utc_datetime_usec, [])
    end

    alter table(:resource_documents) do
      add(:deleted_at, :utc_datetime_usec, [])
    end
  end
end
