defimpl OperatelyWeb.Api.Serializable, for: Operately.People.AgentDef do
  alias Operately.People.AgentDef

  def serialize(%AgentDef{} = agent_def, level: :full) do
    %{
      definition: agent_def.definition || "",
      sandbox_mode: agent_def.sandbox_mode,
      planning_instructions: agent_def.planning_instructions || "",
      task_execution_instructions: agent_def.task_execution_instructions || ""
    }
  end
end
