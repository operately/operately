defmodule Operately.Repo.Migrations.BackfillMigrationVersionEditors do
  use Ecto.Migration

  def up do
    Operately.Data.Change111BackfillMigrationVersionEditors.run()
  end

  def down do
    :ok
  end
end
