defmodule Operately.Operations.KpiUpdating do
  alias Operately.Kpis.Kpi

  def run(%Kpi{} = kpi, attrs) do
    kpi
    |> Kpi.changeset(attrs)
    |> Operately.Repo.update()
  end
end
