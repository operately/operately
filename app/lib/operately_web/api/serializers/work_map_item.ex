defimpl OperatelyWeb.Api.Serializable, for: Operately.WorkMaps.WorkMapItem do
  def serialize(item, level: :essential) do
    %{
      id: item.id,
      parent_id: item.parent_id,
      name: item.name,
      status: item.status,
      progress: item.progress,
      type: item.type,
    }
  end

  def serialize(item, level: :full) do
    serialize(item, level: :essential) |> Map.merge(%{
      deadline: OperatelyWeb.Api.Serializer.serialize(item.deadline),
      closed_at: OperatelyWeb.Api.Serializer.serialize(item.closed_at),
      space: OperatelyWeb.Api.Serializer.serialize(item.space),
      owner: OperatelyWeb.Api.Serializer.serialize(item.owner),
      next_step: item.next_step,
      is_new: item.is_new,
      completed_on: OperatelyWeb.Api.Serializer.serialize(item.completed_on),
      started_at: OperatelyWeb.Api.Serializer.serialize(item.started_at),
      timeframe: OperatelyWeb.Api.Serializer.serialize(item.timeframe),
      children: OperatelyWeb.Api.Serializer.serialize(item.children, level: :full)
    })
  end
end
