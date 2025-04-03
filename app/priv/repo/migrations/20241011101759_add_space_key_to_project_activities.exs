defmodule Operately.Repo.Migrations.AddSpaceKeyToProjectActivities do
  use Ecto.Migration

  def up do
    Operately.Data.Change036AddSpaceToProjectActivities.run()
  end

  def down do

  end
end
