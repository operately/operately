defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectTaskCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content.project, level: :essential),
      task: Serializer.serialize(content.task, level: :essential),
      comment: OperatelyWeb.Api.Serializer.serialize(content.comment)
    }
  end
end
