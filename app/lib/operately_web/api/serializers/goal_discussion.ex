defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Discussion do
  def serialize(discussion, level: :essential) do
    activity = Map.put(discussion.activity, :comment_thread, discussion)

    %{
      id: OperatelyWeb.Paths.goal_discussion_id(discussion),
      title: discussion.title,
      author: OperatelyWeb.Api.Serializer.serialize(discussion.author, level: :essential),
      activity_id: OperatelyWeb.Paths.activity_id(activity),
      comment_count: discussion.comment_count,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(discussion.inserted_at),
      content: Jason.encode!(discussion.content)
    }
  end
end
