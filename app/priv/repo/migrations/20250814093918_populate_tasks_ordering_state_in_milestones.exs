defmodule Operately.Repo.Migrations.PopulateTasksOrderingStateInMilestones do
  use Ecto.Migration

  def up do
    Operately.Data.Change073PopulateTasksOrderingState.run()
  end

  def down do

  end
end
