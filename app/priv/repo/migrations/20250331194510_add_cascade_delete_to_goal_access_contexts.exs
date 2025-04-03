defmodule Operately.Repo.Migrations.AddCascadeDeleteToGoalAccessContexts do
  use Ecto.Migration

  def up do
    drop constraint(:access_contexts, "access_contexts_goal_id_fkey")

    alter table(:access_contexts) do
      modify :goal_id, references(:goals, on_delete: :delete_all, type: :binary_id), null: true
    end
  end

  def down do
    drop constraint(:access_contexts, "access_contexts_goal_id_fkey")

    alter table(:access_contexts) do
      modify :goal_id, references(:goals, on_delete: :nothing, type: :binary_id), null: true
    end
  end
end
