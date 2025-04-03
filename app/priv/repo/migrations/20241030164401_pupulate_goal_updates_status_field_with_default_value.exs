defmodule Operately.Repo.Migrations.PupulateGoalUpdatesStatusFieldWithDefaultValue do
  use Ecto.Migration

  def up do
    Operately.Data.Change040AddStatusValueForExistingGoalUpdates.run()
  end

  def down do

  end
end
