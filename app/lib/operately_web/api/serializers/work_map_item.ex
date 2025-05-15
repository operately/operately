defimpl OperatelyWeb.Api.Serializable, for: Operately.WorkMaps.WorkMapItem do
  alias OperatelyWeb.Paths

  def serialize(item, level: :essential) do
    %{
      id: item_id(item),
      parent_id: item.parent_id,
      name: item.name,
      status: item.status,
      state: item.state,
      progress: item.progress,
      type: item.type,
      item_path: item_path(item),
      children: OperatelyWeb.Api.Serializer.serialize(item.children, level: :essential)
    }
  end

  def serialize(item, level: :full) do
    serialize(item, level: :essential)
    |> Map.merge(%{
      space: OperatelyWeb.Api.Serializer.serialize(item.space),
      space_path: Paths.space_work_map_path(item.company, item.space),
      owner: OperatelyWeb.Api.Serializer.serialize(item.owner),
      owner_path: item.owner && Paths.person_path(item.company, item.owner),
      next_step: item.next_step,
      is_new: item.is_new,
      completed_on: OperatelyWeb.Api.Serializer.serialize(item.completed_on),
      timeframe: OperatelyWeb.Api.Serializers.Timeframe.serialize(item.timeframe),
      children: OperatelyWeb.Api.Serializer.serialize(item.children, level: :full),
      privacy: OperatelyWeb.Api.Serializer.serialize(item.privacy),
      assignees: OperatelyWeb.Api.Serializer.serialize(item.assignees)
    })
  end

  defp item_id(item) do
    case item.type do
      :goal -> Paths.goal_id(item.resource)
      :project -> Paths.project_id(item.resource)
    end
  end

  defp item_path(item) do
    cond do
      item.type == :goal -> Paths.goal_path(item.company, item.resource)
      item.type == :project -> Paths.project_path(item.company, item.resource)
    end
  end
end
