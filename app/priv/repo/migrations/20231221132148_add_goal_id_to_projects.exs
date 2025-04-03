defmodule Operately.Repo.Migrations.AddGoalIdToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :goal_id, references(:goals, type: :binary_id)
    end
  end
end
