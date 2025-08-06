defimpl OperatelyWeb.Api.Serializable, for: Operately.Comments.CommentThread do
  def serialize(thread, level: :essential) do
    %{
      id: OperatelyWeb.Paths.comment_thread_id(thread),
      title: thread.title || "",
      message: Jason.encode!(thread.message),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(thread.inserted_at),
      author: OperatelyWeb.Api.Serializer.serialize(thread.author),
      reactions: OperatelyWeb.Api.Serializer.serialize(thread.reactions),
      notifications: OperatelyWeb.Api.Serializer.serialize(thread.notifications),
      project: OperatelyWeb.Api.Serializer.serialize(thread.project),
      space: OperatelyWeb.Api.Serializer.serialize(thread.space),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(thread.subscription_list),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(thread.potential_subscribers),
      comments_count: thread.comments_count,
      can_comment: thread.can_comment
    }
  end

  def serialize(thread, level: :full) do
    serialize(thread, level: :essential)
  end
end
