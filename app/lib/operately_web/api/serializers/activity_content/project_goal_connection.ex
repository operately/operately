defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectGoalConnection do
  def serialize(content, level: :essential) do
    %{
      project: OperatelyWeb.Api.Serializer.serialize(content["project"], level: :essential),
      goal: OperatelyWeb.Api.Serializer.serialize(content["goal"], level: :essential),
      previous_goal: OperatelyWeb.Api.Serializer.serialize(content["previous_goal"], level: :essential),
      goal_name: content["goal_name"],
      previous_goal_name: content["previous_goal_name"]
    }
  end
end
