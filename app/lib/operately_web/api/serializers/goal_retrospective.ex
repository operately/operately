defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Retrospective do
  def serialize(discussion, level: :essential) do
    %{
      author: OperatelyWeb.Api.Serializer.serialize(discussion.author, level: :essential),
      comment_count: discussion.comment_count,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(discussion.inserted_at),
      content: Jason.encode!(discussion.content)
    }
  end
end
