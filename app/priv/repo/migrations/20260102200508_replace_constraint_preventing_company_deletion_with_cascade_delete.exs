defmodule Operately.Repo.Migrations.ReplaceConstraintPreventingCompanyDeletionWithCascadeDelete do
  use Ecto.Migration

  def up do
    drop constraint(:task_assignees, :task_assignees_task_id_fkey)

    alter table(:task_assignees) do
      modify :task_id, references(:tasks, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:task_assignees, :task_assignees_task_id_fkey)

    alter table(:task_assignees) do
      modify :task_id, references(:tasks, on_delete: :nothing, type: :binary_id)
    end
  end
end
