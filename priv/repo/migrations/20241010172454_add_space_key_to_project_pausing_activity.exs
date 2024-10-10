defmodule Operately.Repo.Migrations.AddSpaceKeyToProjectPausingActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change034AddSpaceProjectPausingToActivity.run()
  end

  def down do

  end
end
