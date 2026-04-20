defmodule Operately.Repo.Migrations.RemoveProjectReviewRequestsTable do
  use Ecto.Migration

  def change do
    drop table(:project_review_requests)
  end
end
