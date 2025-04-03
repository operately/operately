defmodule Operately.Repo.Migrations.CreateProjectContributors do
  use Ecto.Migration

  def change do
    create table(:project_contributors, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :responsibility, :string
      add :project_id, references(:projects, on_delete: :nothing, type: :binary_id)
      add :person_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:project_contributors, [:project_id])
    create index(:project_contributors, [:person_id])
  end
end
