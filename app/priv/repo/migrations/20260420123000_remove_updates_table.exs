defmodule Operately.Repo.Migrations.RemoveUpdatesTable do
  use Ecto.Migration

  def change do
    drop table(:updates)
  end
end
