defmodule Operately.Repo.Migrations.AddDescriptionToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :description, :map
    end
  end
end
