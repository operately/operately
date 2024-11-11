defmodule Operately.Repo.Migrations.AddTimestampsToResourceNodesAndFolders do
  use Ecto.Migration

  def change do
    alter table(:resource_nodes) do
      timestamps()
    end

    alter table(:resource_folders) do
      timestamps()
    end
  end
end
