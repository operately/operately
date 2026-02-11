defimpl OperatelyWeb.Api.Serializable, for: Operately.WorkMaps.WorkMapItem do
  alias OperatelyWeb.Paths

  def serialize(item, level: :essential) do
    %{
      id: item_id(item),
      parent_id: item.parent_id,
      name: item.name,
      status: item.status,
      task_status: OperatelyWeb.Api.Serializer.serialize(item.task_status),
      state: item.state,
      progress: item.progress,
      type: item.type,
      item_path: item_path(item),
      space: OperatelyWeb.Api.Serializer.serialize(item.space),
      space_path: space_path(item),
      project: item.project && OperatelyWeb.Api.Serializer.serialize(item.project),
      project_path: item.project && Paths.project_path(item.company, item.project),
      owner: OperatelyWeb.Api.Serializer.serialize(item.owner),
      owner_path: item.owner && Paths.person_path(item.company, item.owner),
      reviewer: OperatelyWeb.Api.Serializer.serialize(item.reviewer),
      reviewer_path: reviewer_path(item),
      next_step: item.next_step,
      is_new: item.is_new,
      completed_on: OperatelyWeb.Api.Serializer.serialize(item.completed_on),
      timeframe: OperatelyWeb.Api.Serializer.serialize(item.timeframe),
      children: OperatelyWeb.Api.Serializer.serialize(item.children),
      privacy: OperatelyWeb.Api.Serializer.serialize(item.privacy),
      assignees: OperatelyWeb.Api.Serializer.serialize(item.assignees)
    }
  end

  defp item_id(item) do
    case item.type do
      :goal -> Paths.goal_id(item.resource)
      :project -> Paths.project_id(item.resource)
      :task -> Paths.task_id(item.resource)
    end
  end

  defp item_path(item) do
    cond do
      item.type == :goal -> Paths.goal_path(item.company, item.resource)
      item.type == :project -> Paths.project_path(item.company, item.resource)
      item.type == :task and not is_nil(item.resource.project_id) -> Paths.project_task_path(item.company, item.resource)
      item.type == :task -> Paths.space_task_path(item.company, item.space, item.resource)
    end
  end

  defp reviewer_path(item) do
    if item.reviewer && Ecto.assoc_loaded?(item.reviewer) do
      Paths.person_path(item.company, item.reviewer)
    else
      nil
    end
  end

  defp space_path(item) do
    case item.space do
      %Operately.Groups.Group{} -> Paths.space_work_map_path(item.company, item.space)
      _ -> nil
    end
  end
end
