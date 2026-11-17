defmodule Operately.Repo.Migrations.AddDefaultResourceHubToSpaces do
  use Ecto.Migration

  def up do
    alter table(:groups) do
      add :default_resource_hub_id,
          references(:resource_hubs, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:groups, [:default_resource_hub_id])

    flush()

    Operately.Data.Change119BackfillDefaultResourceHubs.run()
  end

  def down do
    alter table(:groups) do
      remove_if_exists :default_resource_hub_id, :binary_id
    end
  end
end
