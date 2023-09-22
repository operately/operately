defmodule Operately.Repo.Migrations.CreateMilestoneComments do
  use Ecto.Migration

  def change do
    create table(:milestone_comments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :action, :string
      add :comment_id, references(:comments, on_delete: :nothing, type: :binary_id)
      add :milestone_id, references(:project_milestones, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:milestone_comments, [:comment_id])
    create index(:milestone_comments, [:milestone_id])
  end
end
