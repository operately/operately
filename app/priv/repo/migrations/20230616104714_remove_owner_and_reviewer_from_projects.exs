defmodule Operately.Repo.Migrations.RemoveOwnerAndReviewerFromProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      remove :owner_id
      remove :reviewer_id
    end
  end
end
