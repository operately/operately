defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskAssigneeUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      old_assignee: Serializer.serialize(content["old_assignee"], level: :essential),
      new_assignee: Serializer.serialize(content["new_assignee"], level: :essential),
    }
  end
end
