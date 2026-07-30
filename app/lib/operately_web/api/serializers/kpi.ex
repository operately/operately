defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.Kpi do
  def serialize(kpi, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(kpi.id),
      name: kpi.name,
      description: kpi.description,
      unit: kpi.unit,
      target: kpi.target,
      target_direction: kpi.target_direction,
      warning_threshold: kpi.warning_threshold,
      warning_direction: kpi.warning_direction,
      danger_threshold: kpi.danger_threshold,
      danger_direction: kpi.danger_direction,
      data_points: OperatelyWeb.Api.Serializer.serialize(kpi.data_points),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(kpi.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(kpi.updated_at)
    }
  end
end
