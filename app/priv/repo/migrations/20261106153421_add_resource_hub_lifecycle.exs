defmodule Operately.Repo.Migrations.AddResourceHubLifecycle do
  use Ecto.Migration

  def up do
    alter table(:resource_hubs) do
      add :position, :integer
    end

    create index(:resource_hubs, [:space_id, :position])

    flush()

    Operately.Data.Change120OrderResourceHubs.run()

    alter table(:resource_hubs) do
      modify :position, :integer, null: false, default: 0
    end
  end

  def down do
    drop index(:resource_hubs, [:space_id, :position])

    alter table(:resource_hubs) do
      remove :position
    end
  end
end
