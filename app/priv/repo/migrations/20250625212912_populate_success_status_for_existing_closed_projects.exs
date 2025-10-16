defmodule Operately.Repo.Migrations.PopulateSuccessStatusForExistingClosedProjects do
  use Ecto.Migration

  def up do
    Operately.Data.Change063SetProjectSuccessStatus.run()
  end

  def down do
  end
end
