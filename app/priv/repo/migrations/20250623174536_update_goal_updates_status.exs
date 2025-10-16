defmodule Operately.Repo.Migrations.UpdateGoalUpdatesStatus do
  use Ecto.Migration

  def up do
    Operately.Data.Change059UpdateGoalUpdateStatus.run()
  end

  def down do
  end
end
