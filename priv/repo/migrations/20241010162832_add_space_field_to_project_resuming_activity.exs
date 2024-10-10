defmodule Operately.Repo.Migrations.AddSpaceFieldToProjectResumingActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change033AddSpaceToProjectResumingActivity.run()
  end

  def down do

  end
end
