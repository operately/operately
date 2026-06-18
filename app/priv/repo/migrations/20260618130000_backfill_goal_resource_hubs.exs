defmodule Operately.Repo.Migrations.BackfillGoalResourceHubs do
  use Ecto.Migration

  def up do
    Operately.Data.Change103BackfillGoalResourceHubs.run()
  end

  def down do
    :ok
  end
end
