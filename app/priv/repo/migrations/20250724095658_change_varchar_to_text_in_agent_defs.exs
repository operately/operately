defmodule Operately.Repo.Migrations.ChangeVarcharToTextInAgentDefs do
  use Ecto.Migration

  def change do
    alter table(:agent_runs) do
      modify :definition, :text, from: :string
    end
  end
end
