defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.DiscussionCommentSubmitted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      discussion: Serializer.serialize(content["discussion"], level: :essential),
      comment: Serializer.serialize(content["comment"], level: :essential),
    }
  end
end
