defmodule Operately.Repo.Migrations.PopulateProjectGoalConnectionActivityWithMissingFields do
  use Ecto.Migration

  def change do
    Operately.Data.Change076EnhanceProjectGoalConnectionActivities.run()
  end
end
