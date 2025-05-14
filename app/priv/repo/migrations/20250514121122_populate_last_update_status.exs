defmodule Operately.Repo.Migrations.PopulateLastUpdateStatus do
  use Ecto.Migration

  def up do
    Operately.Data.Change053PopulateGoalLastUpdateStatus.run()
  end
end
