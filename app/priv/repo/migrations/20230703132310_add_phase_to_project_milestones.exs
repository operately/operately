defmodule Operately.Repo.Migrations.AddPhaseToProjectMilestones do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :phase, :string, default: "concept"
    end
  end
end
