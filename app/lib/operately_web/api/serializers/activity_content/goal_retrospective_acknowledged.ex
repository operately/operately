defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.GoalRetrospectiveAcknowledged do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      goal: Serializer.serialize(content["goal"], level: :essential),
      retrospective_id: content["retrospective_id"] && Operately.ShortUuid.encode!(content["retrospective_id"]),
    }
  end
end
