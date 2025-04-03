defmodule Operately.Repo.Migrations.PopulateLastCheckInOnGoals do
  use Ecto.Migration

  def up do
    Operately.Data.Change051PopulateGoalLastCheckIns.run()
  end

  def down do
  end
end
