defmodule Operately.Repo.Migrations.CreateProjectReviewRequests do
  use Ecto.Migration

  def change do
    create table(:project_review_requests, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :content, :map
      add :project_id, references(:projects, on_delete: :nothing, type: :binary_id)
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:project_review_requests, [:project_id])
    create index(:project_review_requests, [:author_id])
  end
end
