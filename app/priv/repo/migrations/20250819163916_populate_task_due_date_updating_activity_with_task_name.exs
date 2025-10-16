defmodule Operately.Repo.Migrations.PopulateTaskDueDateUpdatingActivityWithTaskName do
  use Ecto.Migration

  def up do
    Operately.Data.Change077EnhanceTaskDueDateUpdatingActivities.run()
  end

  def down do
  end
end
