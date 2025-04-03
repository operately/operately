defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalReparent do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      goal: Serializer.serialize(content["goal"], level: :essential),
      old_parent_goal: Serializer.serialize(content["old_parent_goal"], level: :essential),
      new_parent_goal: Serializer.serialize(content["new_parent_goal"], level: :essential),
    }
  end
end
