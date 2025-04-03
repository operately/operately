defmodule Operately.Repo.Migrations.AddSpaceToProjectTimelineEditedActivity do
  use Ecto.Migration

  def up do
    Operately.Data.Change039AddSpaceToProjectTimelineEditedActivity.run()
  end

  def down do

  end
end
