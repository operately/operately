defmodule Operately.Operations.KpiDataPointUpdating do
  alias Operately.Kpis.DataPoint

  def run(%DataPoint{} = data_point, attrs) do
    data_point
    |> DataPoint.changeset(attrs)
    |> Operately.Repo.update()
  end
end
