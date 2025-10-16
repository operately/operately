defmodule Operately.Repo.Migrations.PopulateProjectIdInTasksSchema do
  use Ecto.Migration

  def up do
    Operately.Data.Change072PopulateProjectIdInTasks.run()
  end

  def down do
  end
end
