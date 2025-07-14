defimpl OperatelyWeb.Api.Serializable, for: Operately.People.AgentDef do
  alias Operately.People.AgentDef

  def serialize(%AgentDef{} = agent_def, level: :full) do
    %{
      definition: agent_def.definition || "",
      sandbox_mode: agent_def.sandbox_mode
    }
  end
end
