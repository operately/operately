defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Target do
  def serialize(target, level: :essential) do
    %{
      id: target.id,
      name: target.name,
      from: target.from,
      to: target.to,
      unit: target.unit,
      index: target.index,
      value: target.value,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(target.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(target.updated_at),
    }
  end
end
