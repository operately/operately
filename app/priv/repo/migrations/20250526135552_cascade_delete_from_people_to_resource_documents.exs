defmodule Operately.Repo.Migrations.CascadeDeleteFromPeopleToResourceDocuments do
  use Ecto.Migration

  def up do
    drop constraint(:resource_documents, :resource_documents_author_id_fkey)

    alter table(:resource_documents) do
      modify :author_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:resource_documents, :resource_documents_author_id_fkey)

    alter table(:resource_documents) do
      modify :author_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end
