defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.Task do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(task, level: :essential) do
    %{
      id: Paths.project_template_task_id(task),
      project_template_id: Paths.project_template_id(task.project_template_id),
      project_template_milestone_id: task.project_template_milestone_id && Paths.project_template_milestone_id(task.project_template_milestone_id),
      name: task.name,
      description: Jason.encode!(task.description),
      priority: task.priority,
      size: task.size,
      due_offset_days: task.due_offset_days,
      reminders: Serializer.serialize(task.reminders),
      task_status: Serializer.serialize(task.task_status),
      inserted_at: Serializer.serialize(task.inserted_at),
      updated_at: Serializer.serialize(task.updated_at)
    }
  end

  def serialize(task, level: :full), do: serialize(task, level: :essential)
end
