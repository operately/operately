defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalCheckIn do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.Timeframe

  def serialize(content, level: :essential) do
    %{
      goal_id: OperatelyWeb.Paths.goal_id(content["goal"]),
      goal: Serializer.serialize(content["goal"], level: :essential),
      update: Serializer.serialize(content["update"], level: :essential)
    }
    |> maybe_include_timeframes(content)
  end

  defp maybe_include_timeframes(result, content) do
    if content["new_timeframe"] && content["old_timeframe"] do
      Map.merge(result, %{
        new_timeframe: Timeframe.serialize(content["new_timeframe"]),
        old_timeframe: Timeframe.serialize(content["old_timeframe"])
      })
    else
      result
    end
  end
end
