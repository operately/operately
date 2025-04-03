defmodule Operately.Repo.Migrations.AddMissionToGroups do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      add :mission, :string
    end
  end
end
