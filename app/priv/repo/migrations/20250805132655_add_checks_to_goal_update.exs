defmodule Operately.Repo.Migrations.AddChecksToGoalUpdate do
  use Ecto.Migration

  def change do
    alter table(:goal_updates) do
      add :checks, {:array, :jsonb}, default: []
    end
  end
end
