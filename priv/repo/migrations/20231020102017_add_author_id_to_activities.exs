defmodule Operately.Repo.Migrations.AddAuthorIdToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :author_id, references(:people, type: :binary_id)
    end
  end
end
