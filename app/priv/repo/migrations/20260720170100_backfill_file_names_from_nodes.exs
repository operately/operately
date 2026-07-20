defmodule Operately.Repo.Migrations.BackfillFileNamesFromNodes do
  use Ecto.Migration

  def up do
    Operately.Data.Change108BackfillFileNamesFromNodes.run()
  end

  def down do
    :ok
  end
end
