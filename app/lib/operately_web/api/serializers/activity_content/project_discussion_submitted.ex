defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectDiscussionSubmitted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      discussion: Serializer.serialize(content["discussion"], level: :essential),
      title: content["title"]
    }
  end
end
