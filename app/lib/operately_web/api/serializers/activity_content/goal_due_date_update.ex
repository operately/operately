defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalDueDateUpdate do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      goal_id: Serializer.serialize(content["goal_id"], level: :essential),
      goal: Serializer.serialize(content["goal"], level: :essential),
      old_due_date: Serializer.serialize(content["old_due_date"], level: :essential),
      new_due_date: Serializer.serialize(content["new_due_date"], level: :essential)
    }
  end
end
