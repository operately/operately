defmodule Operately.Repo.Migrations.AddResourceHubLinkSchema do
  use Ecto.Migration

  def change do
    create table(:resource_links, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:resource_nodes, on_delete: :nothing, type: :binary_id)
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)
      add :subscription_list_id, references(:subscription_lists, on_delete: :nothing, type: :binary_id)

      add :url, :string
      add :description, :map
      add :type, :string

      add :deleted_at, :utc_datetime_usec, []

      timestamps()
    end

    create index(:resource_links, [:node_id])
    create index(:resource_links, [:author_id])
    create index(:resource_links, [:subscription_list_id])
  end
end
