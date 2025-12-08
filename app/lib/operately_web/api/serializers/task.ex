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
      status: OperatelyWeb.Api.Serializer.serialize(task.task_status),
      due_date: OperatelyWeb.Api.Serializer.serialize(task.due_date),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(task.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(task.updated_at),
      assignees: OperatelyWeb.Api.Serializer.serialize(task.assigned_people),
      milestone: OperatelyWeb.Api.Serializer.serialize(task.milestone),
      project: OperatelyWeb.Api.Serializer.serialize(task.project),
      creator: OperatelyWeb.Api.Serializer.serialize(task.creator),
      space: OperatelyWeb.Api.Serializer.serialize(task.space),
      project_space: OperatelyWeb.Api.Serializer.serialize(task.project_space),
      permissions: OperatelyWeb.Api.Serializer.serialize(task.permissions),
      comments_count: task.comments_count,
      subscription_list: OperatelyWeb.Api.Serializer.serialize(task.subscription_list),
      available_statuses: OperatelyWeb.Api.Serializer.serialize(task.available_statuses),
    }
  end
end
