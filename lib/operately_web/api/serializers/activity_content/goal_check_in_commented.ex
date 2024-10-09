defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalCheckInCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      goal_id: OperatelyWeb.Paths.goal_id(content["goal"]),
      goal: Serializer.serialize(content["goal"], level: :essential),
      update: OperatelyWeb.Api.Serializers.Activity.serialize_goal_check_in_update(content["goal_check_in"]),
      comment: Serializer.serialize(content["comment"]),
    }
  end
end
