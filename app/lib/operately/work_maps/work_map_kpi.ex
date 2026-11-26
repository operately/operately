defmodule Operately.WorkMaps.WorkMapKpi do
  @moduledoc """
  A KPI as shown on a Work Map: its space and the readings loaded for that view.
  """

  alias Operately.Kpis.Kpi

  defstruct [:id, :name, :unit, :cadence, :space, :entries, :latest_entry]

  def from_kpi(kpis) when is_list(kpis), do: Enum.map(kpis, &from_kpi/1)

  def from_kpi(%Kpi{} = kpi) do
    %__MODULE__{
      id: kpi.id,
      name: kpi.name,
      unit: kpi.unit,
      cadence: kpi.cadence,
      space: kpi.space,
      entries: entries(kpi.entries),
      latest_entry: kpi.latest_entry
    }
  end

  defp entries(entries) when is_list(entries), do: entries
  defp entries(_entries), do: []
end
