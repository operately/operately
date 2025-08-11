defmodule Operately.Repo.Migrations.AddContextualDueDateFieldToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :due_date, :map
    end
  end
end
