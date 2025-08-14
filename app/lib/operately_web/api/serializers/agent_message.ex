defimpl OperatelyWeb.Api.Serializable, for: Operately.People.AgentMessage do
  alias Operately.People.AgentMessage

  def serialize(%AgentMessage{} = m, level: :full) do
    %{
      id: Operately.ShortUuid.encode!(m.id),
      content: m.message,
      timestamp: OperatelyWeb.Api.Serializer.serialize(m.inserted_at, level: :full),
      sender: Atom.to_string(m.source)
    }
  end
end
