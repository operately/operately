defmodule Operately.Repo.Migrations.RemovePinsTable do
  use Ecto.Migration

  def change do
    drop table(:people_pins)
  end
end
