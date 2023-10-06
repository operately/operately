defmodule Operately.Repo.Migrations.AddStatusToReviewRequests do
  use Ecto.Migration

  def change do
    alter table(:project_review_requests) do
      add :status, :string, default: "pending"
      add :update_id, references(:updates, on_delete: :delete_all, type: :binary_id)
    end
  end
end
