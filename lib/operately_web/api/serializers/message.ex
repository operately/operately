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
      space: serialize_space(message.space),
      reactions: OperatelyWeb.Api.Serializer.serialize(message.reactions),
      comments: OperatelyWeb.Api.Serializer.serialize(message.comments),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(message.subscription_list),
    }
  end

  defp serialize_space(space) do
    if Ecto.assoc_loaded?(space) and Ecto.assoc_loaded?(space.members) and Ecto.assoc_loaded?(space.company) do
      OperatelyWeb.Api.Serializer.serialize(space, level: :full)
    else
      OperatelyWeb.Api.Serializer.serialize(space)
    end
  end
end
