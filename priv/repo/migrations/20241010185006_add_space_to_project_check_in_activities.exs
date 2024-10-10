defmodule Operately.Repo.Migrations.AddSpaceToProjectCheckInActivities do
  use Ecto.Migration

  def up do
    Operately.Data.Change035AddSpaceToProjectActivities.run()
  end

  def down do

  end
end
