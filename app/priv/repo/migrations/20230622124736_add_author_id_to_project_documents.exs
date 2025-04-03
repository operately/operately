defmodule Operately.Repo.Migrations.AddAuthorIdToProjectDocuments do
  use Ecto.Migration

  def change do
    alter table(:project_documents) do
      add :author_id, references(:people, type: :binary_id)
    end
  end
end
