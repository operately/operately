defmodule Operately.Repo.Migrations.RemoveTenetsTable do
  use Ecto.Migration

  def change do
    drop table(:tenets)
  end
end
