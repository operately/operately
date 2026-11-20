defmodule Operately.Repo.Migrations.UpgradeObanToV14 do
  use Ecto.Migration

  def up do
    Oban.Migration.up(version: 14)
  end

  def down do
    # Oban rolls back through the specified version, leaving the schema at version 11.
    Oban.Migration.down(version: 12)
  end
end
