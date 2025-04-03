defmodule Operately.Repo.Migrations.PopulatePublishedAtFieldInExistingPublishedDocuments do
  use Ecto.Migration

  def up do
    Operately.Data.Change047PopulatePublishedAtFieldInExistingPublishedDocuments.run()
  end

  def down do

  end
end
