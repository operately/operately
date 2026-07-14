defmodule Operately.Repo.Migrations.DeleteAiPeopleAndDropAgentTables do
  use Ecto.Migration

  def up do
    Operately.Data.Change105DeleteAiPeopleAndAgentTables.run()

    drop_if_exists table(:agent_messages)
    drop_if_exists table(:agent_convos)
    drop_if_exists table(:agent_runs)
    drop_if_exists table(:agent_defs)
  end

  def down do
    :ok
  end
end
