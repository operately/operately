defmodule Operately.Repo.Migrations.UpdateAllEixstingTaskStatusUpdatingActivities do
  use Ecto.Migration

  def up do
    Operately.Data.Change089UpdateTaskStatusUpdatingActivities.run()
  end

  def down do
    :ok
  end
end
