defmodule Operately.Repo.Migrations.AddStatusToProjectMilestones do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :status, :string
    end
  end
end
