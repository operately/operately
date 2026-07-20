defmodule Operately.Repo.Migrations.AddNameToResourceDocuments do
  use Ecto.Migration

  def change do
    alter table(:resource_documents) do
      add :name, :string
    end
  end
end
