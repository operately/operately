defmodule Operately.Repo.Migrations.PopulateExistingProjectMilestonesTimeframe do
  use Ecto.Migration

  def up do
    Operately.Data.Change069PopulateProjectMilestonesTimeframe.run()
  end

  def down do
  end
end
