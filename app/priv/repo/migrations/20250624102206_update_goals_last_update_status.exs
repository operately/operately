defmodule Operately.Repo.Migrations.UpdateGoalsLastUpdateStatus do
  use Ecto.Migration

  def up do
    Operately.Data.Change060UpdateGoalsLastUpdateStatus.run()
  end

  def down do
  end
end
