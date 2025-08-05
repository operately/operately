defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Check do
  def serialize(check, level: :essential) do
    %{
      id: OperatelyWeb.Paths.goal_check_id(check),
      name: check.name,
      completed: check.completed,
      index: check.index,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(check.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(check.updated_at)
    }
  end
end
