defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.SpaceTaskCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      task: Serializer.serialize(content.task, level: :essential),
      comment: OperatelyWeb.Api.Serializer.serialize(content.comment),
    }
  end
end
