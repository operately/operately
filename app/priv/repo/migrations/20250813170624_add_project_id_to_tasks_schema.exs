defmodule Operately.Repo.Migrations.AddProjectIdToTasksSchema do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :project_id, references(:projects, type: :binary_id)
    end

    create index(:tasks, [:project_id])
  end
end
