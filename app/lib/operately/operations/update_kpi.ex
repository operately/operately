defmodule Operately.Operations.UpdateKpi do
  alias Operately.Repo
  alias Operately.Kpis.Kpi

  def run(person, %Kpi{} = kpi, attrs) do
    with :ok <- Operately.Kpis.Permissions.check_edit_access(person, kpi.space_id) do
      kpi
      |> Kpi.changeset(attrs)
      |> Repo.update()
    end
  end
end
