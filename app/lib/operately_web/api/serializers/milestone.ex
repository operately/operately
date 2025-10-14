defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Milestone do
  def serialize(milestone, level: :essential) do
    %{
      id: OperatelyWeb.Paths.milestone_id(milestone),
      project: OperatelyWeb.Api.Serializer.serialize(milestone.project),
      creator: OperatelyWeb.Api.Serializer.serialize(milestone.creator),
      title: milestone.title,
      status: to_string(milestone.status),
      description: milestone.description && Jason.encode!(milestone.description),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(milestone.inserted_at),
      completed_at: OperatelyWeb.Api.Serializer.serialize(milestone.completed_at),
      tasks_kanban_state: %{
        todo: encode_task_ids(milestone.tasks_kanban_state["todo"]),
        in_progress: encode_task_ids(milestone.tasks_kanban_state["in_progress"]),
        done: encode_task_ids(milestone.tasks_kanban_state["done"]),
      },
      tasks_ordering_state: OperatelyWeb.Api.Serializer.serialize(milestone.tasks_ordering_state),
      comments: OperatelyWeb.Api.Serializer.serialize(milestone.comments),
      permissions: OperatelyWeb.Api.Serializer.serialize(milestone.permissions),
      timeframe: OperatelyWeb.Api.Serializer.serialize(milestone.timeframe),
      space: OperatelyWeb.Api.Serializer.serialize(milestone.space),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(milestone.subscription_list),
    }
  end

  defp encode_task_ids(nil), do: nil
  defp encode_task_ids(task_ids), do: Enum.map(task_ids, &Operately.ShortUuid.encode!/1)
end
