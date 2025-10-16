defmodule Operately.Repo.Migrations.PopulateExistingGoalsTimeframeWithContextualDate do
  use Ecto.Migration

  def up do
    Operately.Data.Change065TimeframeContextualDateBackfill.run()
  end

  def down do
  end
end
