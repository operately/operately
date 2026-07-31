defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.KpiEntry do
  alias OperatelyWeb.Api.Serializer

  def serialize(entry, level: :essential) do
    %{
      id: OperatelyWeb.Paths.kpi_entry_id(entry),
      value: entry.value,
      period: Serializer.serialize(entry.period),
      recorded_by: Serializer.serialize(entry.recorded_by),
      inserted_at: Serializer.serialize(entry.inserted_at),
      updated_at: Serializer.serialize(entry.updated_at)
    }
  end
end
