defmodule Operately.Repo.Migrations.EnableKpisForAllSpaces do
  use Ecto.Migration

  def up do
    Operately.Data.Change118EnableKpisForAllSpaces.run()
  end

  def down do
    :ok
  end
end
