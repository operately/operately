defmodule Operately.Repo.Migrations.BackfillLinkNamesFromNodes do
  use Ecto.Migration

  def up do
    Operately.Data.Change107BackfillLinkNamesFromNodes.run()
  end

  def down do
    :ok
  end
end
