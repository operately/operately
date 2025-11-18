defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalCheckInCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      goal: Serializer.serialize(content["goal"], level: :essential),
      update: Serializer.serialize(content["goal_check_in"], level: :essential),
      comment: Serializer.serialize(content["comment"]),
    }
  end
end
