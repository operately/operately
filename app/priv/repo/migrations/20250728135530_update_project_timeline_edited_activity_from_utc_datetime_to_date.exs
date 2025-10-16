defmodule Operately.Repo.Migrations.UpdateProjectTimelineEditedActivityFromUtcDatetimeToDate do
  use Ecto.Migration

  def up do
    Operately.Data.Change068UpdateProjectTimelineEditedActivity.run()
  end

  def down do
  end
end
