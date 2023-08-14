defmodule Operately.Repo.Migrations.CreateProjectKeyResources do
  use Ecto.Migration

  def change do
    create table(:project_key_resources, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string
      add :link, :string
      add :type, :string
      add :project_id, references(:projects, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:project_key_resources, [:project_id])
  end
end
