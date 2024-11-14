defmodule Operately.Repo.Migrations.PopulateMessagesBoardIdFieldInMessages do
  use Ecto.Migration

  def change do
    Operately.Data.Change042PopulateMessagesBoardIdFieldInMessages.run()
  end
end
