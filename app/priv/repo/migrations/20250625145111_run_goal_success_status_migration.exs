defmodule Operately.Repo.Migrations.RunGoalSuccessStatusMigration do
  use Ecto.Migration

  def up do
    Operately.Data.Change062SetGoalSuccessStatus.run()
  end

  def down do
  end
end
