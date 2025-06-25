defmodule Operately.Repo.Migrations.RunGoalSuccessStatusMigration do
  use Ecto.Migration

  def up do
    Code.ensure_loaded(Operately.Data.Change062SetGoalSuccessStatus)
    Operately.Data.Change062SetGoalSuccessStatus.run()
  end

  def down do
    # This migration cannot be reversed
  end
end
