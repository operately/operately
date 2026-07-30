defmodule Operately.Operations.KpiCreating do
  alias Operately.Kpis.Kpi

  def run(space, attrs) do
    attrs
    |> Map.put(:space_id, space.id)
    |> Kpi.changeset()
    |> Operately.Repo.insert()
  end
end
