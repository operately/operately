defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalCheckIn do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      goal_id: OperatelyWeb.Paths.goal_id(content["goal"]),
      goal: Serializer.serialize(content["goal"], level: :essential),
      update: Serializer.serialize(content["update"], level: :essential),
      old_timeframe: Serializer.serialize(content["old_timeframe"]),
      new_timeframe: Serializer.serialize(content["new_timeframe"])
    }
  end
end
