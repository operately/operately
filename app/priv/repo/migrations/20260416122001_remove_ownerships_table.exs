defmodule Operately.Repo.Migrations.RemoveOwnershipsTable do
  use Ecto.Migration

  def change do
    drop table(:ownerships)
  end
end
