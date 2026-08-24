defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.Kpi do
  alias OperatelyWeb.Api.Serializer

  def serialize(kpi, level: :essential) do
    %{
      id: OperatelyWeb.Paths.kpi_id(kpi),
      name: kpi.name,
      unit: kpi.unit,
      cadence: Atom.to_string(kpi.cadence),
      description: kpi.description && Jason.encode!(kpi.description),
      space_id: Operately.ShortUuid.encode!(kpi.space_id),
      champion: Serializer.serialize(kpi.champion),
      latest_entry: serialize_latest_entry(kpi),
      subscription_list: serialize_subscription_list(kpi),
      inserted_at: Serializer.serialize(kpi.inserted_at),
      updated_at: Serializer.serialize(kpi.updated_at)
    }
  end

  def serialize(kpi, level: :full) do
    serialize(kpi, level: :essential)
    |> Map.put(:entries, Serializer.serialize(kpi.entries, level: :essential))
  end

  # The list view carries only the most recent entry (value + period) so it can
  # show the latest value without the cost of preloading the full history.
  defp serialize_latest_entry(%{latest_entry: %Operately.Kpis.KpiEntry{} = entry}) do
    Serializer.serialize(entry, level: :essential)
  end

  defp serialize_latest_entry(_kpi), do: nil

  defp serialize_subscription_list(kpi) do
    if Ecto.assoc_loaded?(kpi.subscription_list) do
      Serializer.serialize(kpi.subscription_list)
    else
      nil
    end
  end
end
