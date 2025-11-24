defmodule Operately.Repo.Migrations.AddTaskStatusesEmbeddedFieldToProject do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :task_statuses, {:array, :jsonb}, default: []
    end
  end
end
