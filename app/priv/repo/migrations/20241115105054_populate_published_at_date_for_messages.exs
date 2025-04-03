defmodule Operately.Repo.Migrations.PopulatePublishedAtDateForMessages do
  use Ecto.Migration

  def up do
    execute("UPDATE messages SET published_at = inserted_at")
  end

  def down do
    execute("UPDATE messages SET published_at = NULL")
  end
end
