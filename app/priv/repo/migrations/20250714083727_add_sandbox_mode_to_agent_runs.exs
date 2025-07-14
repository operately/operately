defmodule Operately.Repo.Migrations.AddSandboxModeToAgentRuns do
  use Ecto.Migration

  def change do
    alter table(:agent_runs) do
      add :sandbox_mode, :boolean, null: false, default: false
    end
  end
end
