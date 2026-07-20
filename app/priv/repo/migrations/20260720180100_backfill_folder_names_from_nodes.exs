defmodule Operately.Repo.Migrations.BackfillFolderNamesFromNodes do
  use Ecto.Migration

  def up do
    Operately.Data.Change109BackfillFolderNamesFromNodes.run()
  end

  def down do
    :ok
  end
end
