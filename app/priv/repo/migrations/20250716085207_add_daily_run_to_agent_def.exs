defmodule Operately.Repo.Migrations.AddDailyRunToAgentDef do
  use Ecto.Migration

  def change do
    alter table(:agent_defs) do
      add :daily_run, :boolean, default: false, null: false
    end
  end
end
