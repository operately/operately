defmodule Operately.Repo.Migrations.BackfillDocumentNamesFromNodes do
  use Ecto.Migration

  def up do
    Operately.Data.Change106BackfillDocumentNamesFromNodes.run()
  end

  def down do
    :ok
  end
end
