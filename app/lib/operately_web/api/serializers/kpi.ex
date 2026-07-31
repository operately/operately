defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.Kpi do
  alias OperatelyWeb.Api.Serializer

  def serialize(kpi, level: :essential) do
    %{
      id: OperatelyWeb.Paths.kpi_id(kpi),
      name: kpi.name,
      unit: kpi.unit,
      cadence: Atom.to_string(kpi.cadence),
      space_id: Operately.ShortUuid.encode!(kpi.space_id),
      champion: Serializer.serialize(kpi.champion),
      inserted_at: Serializer.serialize(kpi.inserted_at),
      updated_at: Serializer.serialize(kpi.updated_at)
    }
  end

  def serialize(kpi, level: :full) do
    serialize(kpi, level: :essential)
    |> Map.put(:entries, Serializer.serialize(kpi.entries, level: :essential))
  end
end
