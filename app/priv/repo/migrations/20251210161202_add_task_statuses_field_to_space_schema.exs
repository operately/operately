defmodule Operately.Repo.Migrations.AddTaskStatusesFieldToSpaceSchema do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      add :task_statuses, {:array, :jsonb}, default: []
    end
  end
end
