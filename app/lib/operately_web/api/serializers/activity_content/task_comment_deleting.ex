defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskCommentDeleting do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      task_name: content["task_name"],
      comment_id: content["comment_id"]
    }
  end
end
