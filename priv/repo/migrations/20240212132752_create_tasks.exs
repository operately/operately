defmodule Operately.Repo.Migrations.CreateTasks do
  use Ecto.Migration

  def change do
    create table(:tasks, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string
      add :due_date, :naive_datetime
      add :description, :map
      add :size, :string
      add :priority, :string
      add :assignee_id, references(:people, on_delete: :nothing, type: :binary_id)
      add :space_id, references(:groups, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:tasks, [:assignee_id])
    create index(:tasks, [:space_id])
  end
end
