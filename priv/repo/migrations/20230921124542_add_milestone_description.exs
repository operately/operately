defmodule Operately.Repo.Migrations.AddMilestoneDescription do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :description, :map
    end
  end
end
