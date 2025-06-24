defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalTargetUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      goal_id: Serializer.serialize(content["goal_id"], level: :essential),
      goal: Serializer.serialize(content["goal"], level: :essential),
      target_name: Serializer.serialize(content["target_name"], level: :essential),
      old_value: Serializer.serialize(content["old_value"], level: :essential),
      new_value: Serializer.serialize(content["new_value"], level: :essential),
      unit: Serializer.serialize(content["unit"], level: :essential)
    }
  end
end
