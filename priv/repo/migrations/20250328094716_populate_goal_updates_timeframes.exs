defmodule Operately.Repo.Migrations.PopulateGoalUpdatesTimeframes do
  use Ecto.Migration

  def up do
    Operately.Data.Change052PopulateGoalUpdateTimeframes.run()
  end

  def down do
  end
end
