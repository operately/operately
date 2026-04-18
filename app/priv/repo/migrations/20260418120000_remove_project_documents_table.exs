defmodule Operately.Repo.Migrations.RemoveProjectDocumentsTable do
  use Ecto.Migration

  def change do
    drop table(:project_documents)
  end
end
