defimpl OperatelyWeb.Api.Serializable, for: Operately.Messages.Message do
  def serialize(message, level: :essential) do
    %{
      id: OperatelyWeb.Paths.message_id(message),
      title: message.title,
      body: Jason.encode!(message.body),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(message.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(message.updated_at),
      author: OperatelyWeb.Api.Serializer.serialize(message.author),
    }
  end

  def serialize(message, level: :full) do
    %{
      id: OperatelyWeb.Paths.message_id(message),
      title: message.title,
      body: Jason.encode!(message.body),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(message.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(message.updated_at),
      author: OperatelyWeb.Api.Serializer.serialize(message.author),
      space: OperatelyWeb.Api.Serializer.serialize(message.space),
      reactions: OperatelyWeb.Api.Serializer.serialize(message.reactions),
      comments: OperatelyWeb.Api.Serializer.serialize(message.comments)
    }
  end
end
