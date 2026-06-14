defmodule Operately.Repo.Migrations.BackfillProjectResourceHubs do
  use Ecto.Migration

  def up do
    Operately.Data.Change101BackfillProjectResourceHubs.run()
  end

  def down do
    :ok
  end
end
