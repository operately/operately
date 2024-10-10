defmodule Operately.Repo.Migrations.AddSpaceFieldToProjectCreatedActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change032AddSpaceToProjectCreatedActivity.run()
  end

  def down do

  end
end
