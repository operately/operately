defmodule Operately.Repo.Migrations.RenameExistingResourceHubsToDocumentsAndFiles do
  use Ecto.Migration

  def up do
    Operately.Data.Change044RenameResourceHubs.run()
  end

  def down do

  end
end
