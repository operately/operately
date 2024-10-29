defmodule Operately.Repo.Migrations.AddStatusFieldToGoalUpdates do
  use Ecto.Migration

  def change do
    alter table(:goal_updates) do
      add :status, :string
    end
  end
end
