defmodule Operately.Repo.Migrations.AddProviderToAgentDefsAndAgentRuns do
  use Ecto.Migration

  def change do
    alter table(:agent_defs) do
      add :provider, :string, null: false, default: "openai"
    end

    alter table(:agent_runs) do
      add :provider, :string, null: false, default: "openai"
    end
  end
end
