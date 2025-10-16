defmodule Operately.Repo.Migrations.PopulateGoalDescriptionChangedActivityGoalName do
  use Ecto.Migration

  def up do
    Operately.Data.Change082PopulateGoalDescriptionChangedActivityGoalName.run()
  end

  def down do
  end
end
