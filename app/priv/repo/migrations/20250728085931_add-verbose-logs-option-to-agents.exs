defmodule Elixir.Operately.Repo.Migrations.AddVerboseLogsOptionToAgents do
  use Ecto.Migration

  def change do
    alter table(:agent_defs) do
      add :verbose_logs, :boolean, default: false, null: false
    end

    alter table(:agent_runs) do
      add :verbose_logs, :boolean, default: false, null: false
    end
  end
end
