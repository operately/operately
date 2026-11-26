defimpl OperatelyWeb.Api.Serializable, for: Operately.WorkMaps.WorkMapKpi do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(kpi, level: :essential) do
    %{
      id: Paths.kpi_id(kpi),
      name: kpi.name,
      unit: kpi.unit,
      cadence: kpi.cadence,
      space_id: Paths.space_id(kpi.space),
      space_name: kpi.space.name,
      recent_values: Enum.map(kpi.entries, & &1.value),
      period: Serializer.serialize(period(kpi.latest_entry)),
      value: value(kpi.latest_entry)
    }
  end

  def serialize(kpi, level: :full), do: serialize(kpi, level: :essential)

  defp period(%{period: period}), do: period
  defp period(_entry), do: nil

  defp value(%{value: value}), do: value
  defp value(_entry), do: nil
end
