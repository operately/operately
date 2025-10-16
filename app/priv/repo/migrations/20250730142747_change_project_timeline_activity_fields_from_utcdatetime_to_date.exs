defmodule Operately.Repo.Migrations.ChangeProjectTimelineActivityFieldsFromUtcdatetimeToDate do
  use Ecto.Migration

  def up do
    Operately.Data.Change070UpdateProjectTimelineEditedActivity.run()
  end

  def down do
  end
end
