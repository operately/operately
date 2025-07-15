defmodule Operately.Repo.Migrations.AddTasksToAgentRun do
  use Ecto.Migration

  def change do
    alter table(:agent_runs) do
      add :tasks, {:array, :map}, default: []
    end
  end
end
