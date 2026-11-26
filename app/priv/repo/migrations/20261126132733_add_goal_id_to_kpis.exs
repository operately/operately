defmodule Operately.Repo.Migrations.AddGoalIdToKpis do
  use Ecto.Migration

  def change do
    alter table(:kpis) do
      add :goal_id, references(:goals, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:kpis, [:goal_id])
  end
end
