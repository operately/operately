defmodule Operately.Repo.Migrations.AddSandboxModeToAgentDefs do
  use Ecto.Migration

  def change do
    alter table(:agent_defs) do
      add :sandbox_mode, :boolean, null: false, default: false
    end
  end
end
