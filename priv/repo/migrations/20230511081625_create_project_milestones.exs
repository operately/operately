defmodule Operately.Repo.Migrations.CreateProjectMilestones do
  use Ecto.Migration

  def change do
    create table(:project_milestones, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string
      add :deadline_at, :naive_datetime
      add :project_id, references(:projects, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:project_milestones, [:project_id])
  end
end
