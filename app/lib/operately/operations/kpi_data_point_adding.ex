defmodule Operately.Operations.KpiDataPointAdding do
  alias Operately.Kpis.{Kpi, DataPoint}

  def run(%Kpi{} = kpi, attrs) do
    attrs
    |> Map.put(:kpi_id, kpi.id)
    |> DataPoint.changeset()
    |> Operately.Repo.insert()
  end
end
