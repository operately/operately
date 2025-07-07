defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalClosing do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      goal: Serializer.serialize(content["goal"], level: :essential),
      success_status: content["success_status"]
    }
  end
end
