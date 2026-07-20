defmodule Operately.Repo.Migrations.BaselineDocumentVersions do
  use Ecto.Migration

  def up do
    Operately.Data.Change110BaselineDocumentVersions.run()
  end

  def down do
    :ok
  end
end
