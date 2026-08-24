defmodule Operately.Repo.Migrations.DeleteDuplicateProjectContributorsAndAddUniqueIndex do
  use Ecto.Migration

  def up do
    Operately.Data.Change114DeleteDuplicateProjectContributors.run()

    create unique_index(:project_contributors, [:project_id, :person_id])
  end

  def down do
    drop unique_index(:project_contributors, [:project_id, :person_id])
  end
end
