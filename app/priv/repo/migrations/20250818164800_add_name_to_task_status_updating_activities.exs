defmodule Operately.Repo.Migrations.AddNameToTaskStatusUpdatingActivities do
  use Ecto.Migration

  def up do
    Operately.Data.Change074AddNameToTaskStatusUpdatingActivity.run()
  end

  def down do

  end
end
