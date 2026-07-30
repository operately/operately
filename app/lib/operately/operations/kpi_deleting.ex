defmodule Operately.Operations.KpiDeleting do
  alias Operately.Kpis.Kpi

  def run(%Kpi{} = kpi) do
    Operately.Repo.delete(kpi)
  end
end
