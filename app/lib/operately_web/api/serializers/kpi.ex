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
      entries: serialize_entries(kpi),
      annotations: serialize_annotations(kpi),
      subscription_list: serialize_subscription_list(kpi),
      inserted_at: Serializer.serialize(kpi.inserted_at),
      updated_at: Serializer.serialize(kpi.updated_at)
    }
  end

  def serialize(kpi, level: :full), do: serialize(kpi, level: :essential)

  # Entries are included whenever the caller loaded them: a KPI's own page loads
  # its full history, while the list loads a bounded recent window for the
  # inline trend line.
  defp serialize_entries(kpi) do
    if Ecto.assoc_loaded?(kpi.entries) do
      Serializer.serialize(kpi.entries, level: :essential)
    end
  end

  # The most recent entry (value + period), so a list can show the latest value
  # without depending on how much history was loaded.
  defp serialize_latest_entry(%{latest_entry: %Operately.Kpis.KpiEntry{} = entry}) do
    Serializer.serialize(entry, level: :essential)
  end

  defp serialize_latest_entry(_kpi), do: nil

  defp serialize_annotations(kpi) do
    if Ecto.assoc_loaded?(kpi.annotations) do
      Serializer.serialize(kpi.annotations, level: :essential)
    end
  end

  defp serialize_subscription_list(kpi) do
    if Ecto.assoc_loaded?(kpi.subscription_list) do
      Serializer.serialize(kpi.subscription_list)
    else
      nil
    end
  end
end
