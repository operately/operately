defimpl OperatelyWeb.Api.Serializable, for: Operately.Comments.InlineThread do
  alias OperatelyWeb.Api.Serializer

  def serialize(thread, level: _) do
    %{
      id: Operately.ShortUuid.encode!(thread.id),
      resource_type: Atom.to_string(thread.resource_type),
      resource_id: Operately.ShortUuid.encode!(thread.resource_id),
      author: Serializer.serialize(thread.author),
      resolved_at: Serializer.serialize(thread.resolved_at),
      resolved_by: Serializer.serialize(thread.resolved_by),
      inserted_at: Serializer.serialize(thread.inserted_at),
      anchor: Serializer.serialize(thread.anchor),
      messages: Serializer.serialize(thread.messages)
    }
  end
end
