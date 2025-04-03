defmodule Operately.Repo.Migrations.AddAuthorFieldToResourceHubDocument do
  use Ecto.Migration

  def change do
    alter table(:resource_documents) do
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)
    end

    create index(:resource_documents, [:author_id])
  end
end
