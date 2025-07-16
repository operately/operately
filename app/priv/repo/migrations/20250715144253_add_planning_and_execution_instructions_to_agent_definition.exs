defmodule Operately.Repo.Migrations.AddPlanningAndExecutionInstructionsToAgentDefinition do
  use Ecto.Migration

  def change do
    alter table(:agent_defs) do
      add :planning_instructions, :text, null: false, default: ""
      add :task_execution_instructions, :text, null: false, default: ""
    end
  end
end
