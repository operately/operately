defmodule Operately.Repo.Migrations.BackfillSpaceTaskBoards do
  use Ecto.Migration

  def up do
    Operately.Data.Change121BackfillTaskBoards.run()
  end

  def down, do: :ok
end
