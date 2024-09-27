defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Update  do
  def serialize(update, level: :full) do
    %{
      id: OperatelyWeb.Paths.goal_update_id(update),
      goal: OperatelyWeb.Api.Serializer.serialize(update.goal),
      message: Jason.encode!(update.message),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(update.inserted_at),
      author: OperatelyWeb.Api.Serializer.serialize(update.author),
      acknowledged: !!update.acknowledged_at,
      acknowledged_at: OperatelyWeb.Api.Serializer.serialize(update.acknowledged_at),
      acknowledging_person: OperatelyWeb.Api.Serializer.serialize(update.acknowledged_by),
      reactions: OperatelyWeb.Api.Serializer.serialize(update.reactions),
      comments_count: Operately.Updates.count_comments(update.id, :goal_update),
      goal_target_updates: parse_targets(update.targets),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(update.subscription_list),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(update.potential_subscribers),
    }
  end

  defp parse_targets(nil), do: []
  defp parse_targets(targets), do: Enum.map(targets, &(Map.from_struct(&1)))
end
