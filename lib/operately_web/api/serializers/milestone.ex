defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Milestone do
  def serialize(milestone, level: :essential) do
    %{
      id: OperatelyWeb.Paths.milestone_id(milestone),
      project_id: OperatelyWeb.Paths.project_id(milestone.project),
      title: milestone.title,
      status: to_string(milestone.status),
      description: milestone.description && Jason.encode!(milestone.description),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(milestone.inserted_at),
      deadline_at: OperatelyWeb.Api.Serializer.serialize(milestone.deadline_at),
      completed_at: OperatelyWeb.Api.Serializer.serialize(milestone.completed_at),
      tasks_kanban_state: %{
        todo: encode_task_ids(milestone.tasks_kanban_state["todo"]),
        in_progress: encode_task_ids(milestone.tasks_kanban_state["in_progress"]),
        done: encode_task_ids(milestone.tasks_kanban_state["done"]),
      },
      comments: OperatelyWeb.Api.Serializer.serialize(milestone.comments),
    }
  end

  defp encode_task_ids(nil), do: nil
  defp encode_task_ids(task_ids), do: Enum.map(task_ids, &Operately.ShortUuid.encode!/1)
end
