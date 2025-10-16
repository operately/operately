defmodule Operately.Repo.Migrations.RemoveSelfManagers do
  use Ecto.Migration

  def up do
    Operately.Data.Change056RemoveSelfManagers.run()
  end

  def down do
  end
end
