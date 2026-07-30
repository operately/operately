defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.DataPoint do
  def serialize(data_point, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(data_point.id),
      value: data_point.value,
      recorded_for: OperatelyWeb.Api.Serializer.serialize(data_point.recorded_for)
    }
  end
end
