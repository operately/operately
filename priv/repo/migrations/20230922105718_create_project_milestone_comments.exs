defmodule Operately.Repo.Migrations.CreateProjectMilestoneComments do
  use Ecto.Migration

  def change do
    create table(:project_milestone_comments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :content, :map
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)
      add :milestone_id, references(:project_milestones, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:project_milestone_comments, [:author_id])
    create index(:project_milestone_comments, [:milestone_id])
  end
end
