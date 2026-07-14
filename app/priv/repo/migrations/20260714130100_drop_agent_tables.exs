defmodule Operately.Repo.Migrations.DropAgentTables do
  use Ecto.Migration

  def change do
    drop table(:agent_messages)
    drop table(:agent_convos)
    drop table(:agent_runs)
    drop table(:agent_defs)
  end
end
