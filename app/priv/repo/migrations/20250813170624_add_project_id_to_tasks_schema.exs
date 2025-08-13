defmodule Operately.Repo.Migrations.AddProjectIdToTasksSchema do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :project_id, references(:projects, type: :binary_id, on_delete: :delete_all)
    end

    create index(:tasks, [:project_id])
  end
end
