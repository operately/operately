defmodule Operately.Repo.Migrations.CreateResourceDocumentVersions do
  use Ecto.Migration

  def change do
    create table(:resource_document_versions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :document_id, references(:resource_documents, on_delete: :delete_all, type: :binary_id), null: false
      add :version_number, :integer, null: false
      add :title, :text, null: false
      add :content, :map, null: false
      add :content_schema_version, :integer, null: false
      add :editor_id, references(:people, on_delete: :nilify_all, type: :binary_id)
      add :origin, :string, null: false
      add :restored_from_version_number, :integer

      timestamps(updated_at: false)
    end

    create unique_index(:resource_document_versions, [:document_id, :version_number])
    create index(:resource_document_versions, [:editor_id])

    # History lists load versions for one document newest-first.
    execute(
      "CREATE INDEX resource_document_versions_document_id_inserted_at_index ON resource_document_versions (document_id, inserted_at DESC)",
      "DROP INDEX resource_document_versions_document_id_inserted_at_index"
    )

    create constraint(:resource_document_versions, :resource_document_versions_version_number_positive,
      check: "version_number > 0"
    )

    create constraint(:resource_document_versions, :resource_document_versions_content_schema_version_positive,
      check: "content_schema_version > 0"
    )

    # Optional when set, but never zero or negative.
    create constraint(:resource_document_versions, :resource_document_versions_restored_from_positive,
      check: "restored_from_version_number IS NULL OR restored_from_version_number > 0"
    )
  end
end
