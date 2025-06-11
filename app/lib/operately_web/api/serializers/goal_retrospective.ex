defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Retrospective do
  def serialize(retro, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(retro.id),
      author: OperatelyWeb.Api.Serializer.serialize(retro.author, level: :essential),
      comment_count: retro.comment_count,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(retro.inserted_at),
      content: Jason.encode!(retro.content)
    }
  end
end
