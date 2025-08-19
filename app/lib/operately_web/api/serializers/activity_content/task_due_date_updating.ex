defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskDueDateUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      task_name: content["task_name"],
      old_due_date: Serializer.serialize(content["old_due_date"], level: :essential),
      new_due_date: Serializer.serialize(content["new_due_date"], level: :essential)
    }
  end
end
