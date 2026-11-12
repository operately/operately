defmodule Operately.Repo.Migrations.BackfillProjectTaskBoards do
  use Ecto.Migration

  def up do
    Operately.Data.Change122BackfillProjectTaskBoards.run()
  end

  def down, do: :ok
end
