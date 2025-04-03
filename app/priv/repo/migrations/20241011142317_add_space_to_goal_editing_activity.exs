defmodule Operately.Repo.Migrations.AddSpaceToGoalEditingActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change038AddSpaceToGoalEditingActivity.run()
  end

  def down do

  end
end
