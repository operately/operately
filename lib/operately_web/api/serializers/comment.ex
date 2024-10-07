defimpl OperatelyWeb.Api.Serializable, for: Operately.Updates.Comment do
  def serialize(comment, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(comment.id),
      content: Jason.encode!(comment.content),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(comment.inserted_at),
      author: OperatelyWeb.Api.Serializer.serialize(comment.author),
      reactions: OperatelyWeb.Api.Serializer.serialize(comment.reactions),
      notification: OperatelyWeb.Api.Serializer.serialize(comment.notification),
    }
  end

  def serialize(comment, level: :full) do
    serialize(comment, level: :essential)
  end
end
