defmodule Operately.Repo.Migrations.CreateProjectDocuments do
  use Ecto.Migration

  def change do
    create table(:project_documents, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string
      add :content, :map

      timestamps()
    end
  end
end
