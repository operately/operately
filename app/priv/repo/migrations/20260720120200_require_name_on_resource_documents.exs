defmodule Operately.Repo.Migrations.RequireNameOnResourceDocuments do
  use Ecto.Migration

  def change do
    alter table(:resource_documents) do
      modify :name, :string, null: false
    end
  end
end
