defmodule Operately.Repo.Migrations.AddCompletedAtToMilestones do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :completed_at, :utc_datetime
    end
  end
end
