defmodule Operately.Repo.Migrations.DropSupportForIconsInSpaces do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      remove :icon
      remove :color
    end
  end
end
