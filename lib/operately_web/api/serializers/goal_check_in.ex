defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.CheckIn  do
  def serialize(check_in, level: :full) do
    %{
      id: OperatelyWeb.Paths.goal_update_id(check_in),
      goal: OperatelyWeb.Api.Serializer.serialize(check_in.goal),
      message: Jason.encode!(check_in.message),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(check_in.inserted_at),
      author: OperatelyWeb.Api.Serializer.serialize(check_in.author),
      acknowledged: !!check_in.acknowledged_at,
      acknowledged_at: OperatelyWeb.Api.Serializer.serialize(check_in.acknowledged_at),
      acknowledging_person: OperatelyWeb.Api.Serializer.serialize(check_in.acknowledged_by),
      reactions: [], # OperatelyWeb.Api.Serializer.serialize(check_in.reactions),
      comments_count: 0, # Operately.Updates.count_comments(update.id, :update),
      goal_target_updates: parse_targets(check_in.targets),
    }
  end

  defp parse_targets(nil), do: []
  defp parse_targets(targets), do: Enum.map(targets, &(Map.from_struct(&1)))
end
