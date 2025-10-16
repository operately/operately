defmodule Operately.Repo.Migrations.UpdateProjectsLastCheckInStatus do
  use Ecto.Migration

  def up do
    Operately.Data.Change058UpdateProjectsLastCheckInStatus.run()
  end

  def down do
  end
end
