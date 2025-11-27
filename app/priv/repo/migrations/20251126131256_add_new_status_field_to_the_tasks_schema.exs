defmodule Operately.Repo.Migrations.AddNewStatusFieldToTheTasksSchema do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :task_status, :map
    end
  end
end
