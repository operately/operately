defmodule Operately.Repo.Migrations.AddReviwerToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :reviewer_id, references(:people, type: :binary_id)
    end

    create index(:projects, [:reviewer_id])
  end
end
