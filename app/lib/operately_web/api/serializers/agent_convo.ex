defimpl OperatelyWeb.Api.Serializable, for: Operately.People.AgentConvo do
  alias Operately.People.AgentConvo

  def serialize(%AgentConvo{} = c, level: :full) do
    %{
      id: Operately.ShortUuid.encode!(c.id),
      title: c.title,
      created_at: OperatelyWeb.Api.Serializer.serialize(c.inserted_at, level: :full),
      updated_at: OperatelyWeb.Api.Serializer.serialize(c.updated_at, level: :full),
      messages: sorted_messages(c.messages)
    }
  end

  defp sorted_messages(messages) do
    messages
    |> Enum.sort_by(fn m -> m.index end)
    |> OperatelyWeb.Api.Serializer.serialize(level: :full)
  end
end
