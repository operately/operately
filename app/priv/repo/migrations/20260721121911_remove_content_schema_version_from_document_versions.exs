defmodule Operately.Repo.Migrations.RemoveContentSchemaVersionFromDocumentVersions do
  use Ecto.Migration

  def up do
    drop_if_exists constraint(:resource_document_versions, :resource_document_versions_content_schema_version_positive)

    alter table(:resource_document_versions) do
      remove_if_exists :content_schema_version, :integer
    end
  end

  def down do
    alter table(:resource_document_versions) do
      add :content_schema_version, :integer, null: false, default: 1
    end

    create constraint(:resource_document_versions, :resource_document_versions_content_schema_version_positive,
      check: "content_schema_version > 0"
    )
  end
end
