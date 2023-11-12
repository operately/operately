defmodule Operately.Repo.Migrations.AddIconAndColorToGroups do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      add :icon, :string
      add :color, :string
    end
  end
end
