defmodule Operately.Repo.Migrations.AddPublicTokenToResourceDocuments do
  use Ecto.Migration

  def change do
    alter table(:resource_documents) do
      add :public_token, :string
    end

    create unique_index(:resource_documents, [:public_token])
  end
end
