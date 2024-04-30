defmodule Operately.Repo.Migrations.RenameGoalTimeframeToDeprecatedTimeframe do
  use Ecto.Migration

  def change do
    rename table(:goals), :timeframe, to: :deprecated_timeframe
  end
end
