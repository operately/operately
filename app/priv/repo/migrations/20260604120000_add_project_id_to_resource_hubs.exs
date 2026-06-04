defmodule Operately.Repo.Migrations.AddProjectIdToResourceHubs do
  use Ecto.Migration

  def change do
    alter table(:resource_hubs) do
      add_if_not_exists :project_id,
                        references(:projects, on_delete: :delete_all, type: :binary_id)
    end

    create_if_not_exists index(:resource_hubs, [:project_id],
                           name: :resource_hubs_project_id_lookup_index
                         )

    create_if_not_exists unique_index(:resource_hubs, [:project_id],
                           name: :resource_hubs_project_id_unique_index,
                           where: "project_id IS NOT NULL"
                         )
  end
end
