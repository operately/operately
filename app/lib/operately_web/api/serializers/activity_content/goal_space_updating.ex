defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalSpaceUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      goal_id: Serializer.serialize(content["goal_id"], level: :essential),
      goal: Serializer.serialize(content["goal"], level: :essential),
      old_space_id: Serializer.serialize(content["old_space_id"], level: :essential),
      old_space: Serializer.serialize(content["old_space"], level: :essential)
    }
  end
end
