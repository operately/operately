defmodule Operately.Repo.Migrations.AddResourceHubDocumentsSchema do
  use Ecto.Migration

  def change do
    create table(:resource_documents, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)

      add :content, :map
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:resource_documents, [:node_id])
    create index(:resource_documents, [:subscription_list_id])
  end
end
