defmodule Operately.Repo.Migrations.AddGoalAccessContext do
  use Ecto.Migration

  def change do
    alter table(:access_contexts) do
      add :goal_id, references(:goals, on_delete: :nothing, type: :binary_id), null: true
    end

    create unique_index(:access_contexts, [:goal_id])
  end
end
