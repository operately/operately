defmodule Operately.Repo.Migrations.AddAuthorIdToProjectCheckIns do
  use Ecto.Migration

  def change do
    alter table(:project_check_ins) do
      add :author_id, references(:people, type: :binary_id)
    end
  end
end
