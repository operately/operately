defmodule Operately.Repo.Migrations.AddProjectIdToResourceHubs do
  use Ecto.Migration

  def change do
    alter table(:resource_hubs) do
      add :project_id, references(:projects, on_delete: :delete_all, type: :binary_id)
    end

    create index(:resource_hubs, [:project_id])
  end
end
