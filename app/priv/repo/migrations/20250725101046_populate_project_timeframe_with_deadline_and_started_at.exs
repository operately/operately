defmodule Operately.Repo.Migrations.PopulateProjectTimeframeWithDeadlineAndStartedAt do
  use Ecto.Migration

  def up do
    Operately.Data.Change067PopulateProjectTimeframe.run()
  end

  def down do
  end
end
