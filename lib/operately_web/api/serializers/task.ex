defimpl OperatelyWeb.Api.Serializable, for: Operately.Tasks.Task do
  def serialize(task, level: :essential) do
    %{
      id: OperatelyWeb.Paths.task_id(task),
      name: task.name,
    }
  end

  def serialize(task, level: :full) do
    %{
      id: OperatelyWeb.Paths.task_id(task),
      name: task.name,
      description: task.description && Jason.encode!(task.description),
      priority: task.priority,
      size: task.size,
      status: task.status,
      due_date: OperatelyWeb.Api.Serializer.serialize(task.due_date),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(task.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(task.updated_at),
      assignees: OperatelyWeb.Api.Serializer.serialize(task.assigned_people),
      milestone: OperatelyWeb.Api.Serializer.serialize(task.milestone),
      project: OperatelyWeb.Api.Serializer.serialize(task.project)
    }
  end
end
