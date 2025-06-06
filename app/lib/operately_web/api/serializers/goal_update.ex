defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Update do
  def serialize(update, level: :essential) do
    %{
      id: OperatelyWeb.Paths.goal_update_id(update),
      status: Atom.to_string(update.status),
      message: Jason.encode!(update.message),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(update.inserted_at),
      goal_target_updates: parse_targets(update.targets),
      timeframe: OperatelyWeb.Api.Serializer.serialize(update.timeframe),
      acknowledged: !!update.acknowledged_at,
      acknowledged_at: OperatelyWeb.Api.Serializer.serialize(update.acknowledged_at)
    }
  end

  def serialize(update, level: :full) do
    serialize(update, level: :essential)
    |> Map.merge(%{
      goal: OperatelyWeb.Api.Serializer.serialize(update.goal),
      author: OperatelyWeb.Api.Serializer.serialize(update.author),
      acknowledging_person: OperatelyWeb.Api.Serializer.serialize(update.acknowledged_by),
      reactions: OperatelyWeb.Api.Serializer.serialize(update.reactions),
      comments_count: update.comment_count || 0,
      goal_target_updates: parse_targets(update.targets),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(update.subscription_list),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(update.potential_subscribers),
      notifications: OperatelyWeb.Api.Serializer.serialize(update.notifications),
      permissions: update.permissions && OperatelyWeb.Api.Serializer.serialize(update.permissions)
    })
  end

  defp parse_targets(nil), do: []
  defp parse_targets(targets), do: Enum.map(targets, &Map.from_struct(&1))
end
