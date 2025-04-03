defmodule Operately.Repo.Migrations.ConnectProjectsWithObjectives do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :objective_id, references(:objectives, type: :binary_id)
    end

    create index(:projects, [:objective_id])
  end
end
