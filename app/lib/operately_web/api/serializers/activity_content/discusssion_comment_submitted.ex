defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.DiscussionCommentSubmitted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      discussion: Serializer.serialize(content["discussion"], level: :essential),
      space_id: OperatelyWeb.Paths.space_id(content["space"]),
      comment: Serializer.serialize(content["comment"], level: :essential),
      discussion_id: OperatelyWeb.Paths.message_id(content["discussion"]),
      title: content["title"]
    }
  end
end
