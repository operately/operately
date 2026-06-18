defmodule Operately.Repo.Migrations.AddGoalIdToResourceHubs do
  use Ecto.Migration

  def change do
    alter table(:resource_hubs) do
      add :goal_id, references(:goals, on_delete: :delete_all, type: :binary_id)
    end

    create unique_index(:resource_hubs, [:goal_id])
  end
end
