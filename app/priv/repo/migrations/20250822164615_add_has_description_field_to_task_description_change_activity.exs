defmodule Operately.Repo.Migrations.AddHasDescriptionFieldToTaskDescriptionChangeActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change078EnhanceTaskDescriptionChangeActivities.run()
  end

  def down do
  end
end
