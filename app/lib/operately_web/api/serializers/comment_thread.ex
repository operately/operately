defimpl OperatelyWeb.Api.Serializable, for: Operately.Comments.CommentThread do
  def serialize(thread, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(thread.id),
      title: thread.title || "",
      message: Jason.encode!(thread.message),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(thread.inserted_at),
      author: OperatelyWeb.Api.Serializer.serialize(thread.author),
      reactions: OperatelyWeb.Api.Serializer.serialize(thread.reactions)
    }
  end

  def serialize(thread, level: :full) do
    serialize(thread, level: :essential)
  end
end
