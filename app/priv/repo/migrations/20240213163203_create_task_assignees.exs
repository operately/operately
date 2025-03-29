defmodule Operately.Repo.Migrations.CreateTaskAssignees do
  use Ecto.Migration

  def change do
    create table(:task_assignees, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :task_id, references(:tasks, on_delete: :nothing, type: :binary_id)
      add :person_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:task_assignees, [:task_id])
    create index(:task_assignees, [:person_id])
  end
end
