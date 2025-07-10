defimpl OperatelyWeb.Api.Serializable, for: Operately.People.AgentDef do
  alias Operately.People.AgentDef

  def serialize(%AgentDef{} = agent_def, level: :full) do
    %{
      definition: agent_def.definition || ""
    }
  end
end
