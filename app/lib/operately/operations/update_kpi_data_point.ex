defmodule Operately.Operations.UpdateKpiDataPoint do
  alias Operately.Repo
  alias Operately.Kpis.{Kpi, DataPoint}

  def run(person, %DataPoint{} = data_point, attrs) do
    kpi = Repo.get!(Kpi, data_point.kpi_id)

    with :ok <- Operately.Kpis.Permissions.check_edit_access(person, kpi.space_id) do
      data_point
      |> DataPoint.changeset(attrs)
      |> Repo.update()
    end
  end
end
