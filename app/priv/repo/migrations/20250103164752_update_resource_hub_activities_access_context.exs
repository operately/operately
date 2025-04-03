defmodule Operately.Repo.Migrations.UpdateResourceHubActivitiesAccessContext do
  use Ecto.Migration

  def up do
    Operately.Data.Change045UpdateResourceHubActivitiesAccessContext.run()
  end

  def down do

  end
end
