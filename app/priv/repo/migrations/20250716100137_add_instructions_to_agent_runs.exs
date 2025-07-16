defmodule Operately.Repo.Migrations.AddInstructionsToAgentRuns do
  use Ecto.Migration

  def change do
    alter table(:agent_runs) do
      add :definition, :string, null: false, default: ""
      add :planning_instructions, :text, null: false, default: ""
      add :task_execution_instructions, :text, null: false, default: ""
    end
  end
end
