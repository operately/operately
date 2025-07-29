defmodule Operately.Repo.Migrations.AddTimeframeFieldToProjectMilestoneSchema do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :timeframe, :jsonb
    end
  end
end
