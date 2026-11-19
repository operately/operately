defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskAssigneeUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      old_assignee: Serializer.serialize(content["old_assignee"], level: :essential),
      new_assignee: Serializer.serialize(content["new_assignee"], level: :essential),
      added_assignees: Serializer.serialize(content["added_assignees"], level: :essential),
      removed_assignees: Serializer.serialize(content["removed_assignees"], level: :essential)
    }
  end
end
