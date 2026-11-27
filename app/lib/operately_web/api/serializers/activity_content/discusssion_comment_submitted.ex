defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.DiscussionCommentSubmitted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    result = %{
      discussion: Serializer.serialize(content.discussion, level: :essential),
      comment: Serializer.serialize(content.comment, level: :essential)
    }

    if content.project_id do
      Map.put(result, :project, Serializer.serialize(content.project, level: :essential))
    else
      Map.put(result, :space, Serializer.serialize(content.space, level: :essential))
    end
  end
end
