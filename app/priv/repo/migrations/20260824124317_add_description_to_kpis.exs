defmodule Operately.Repo.Migrations.AddDescriptionToKpis do
  use Ecto.Migration

  def change do
    alter table(:kpis) do
      add :description, :map
    end
  end
end
