defmodule Operately.Repo.Migrations.AddPreferencesToPeople do
  use Ecto.Migration

  def up do
    alter table(:people) do
      add :preferences, :map
    end
  end

  def down do
    alter table(:people) do
      remove :preferences
    end
  end
end
