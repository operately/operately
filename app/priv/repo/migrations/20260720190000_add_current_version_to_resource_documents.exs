defmodule Operately.Repo.Migrations.AddCurrentVersionToResourceDocuments do
  use Ecto.Migration

  def change do
    alter table(:resource_documents) do
      add :current_version, :integer, null: false, default: 1
    end

    create constraint(:resource_documents, :resource_documents_current_version_positive, check: "current_version > 0")
  end
end
